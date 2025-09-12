import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Queue } from './entities/queue.entity';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueueService {
    constructor(
        @InjectRepository(Queue)
        private queueRepository: Repository<Queue>,
    ) {}

    async create(createQueueDto: CreateQueueDto): Promise<Queue> {
        // Check if user is already in this donation queue
        const existingEntry = await this.queueRepository.findOne({
            where: {
                user_id: createQueueDto.user_id,
                donation_number: createQueueDto.donation_number,
            },
        });

        if (existingEntry) {
            throw new ConflictException('User is already in this donation queue');
        }

        // Check if position is already taken
        const positionTaken = await this.queueRepository.findOne({
            where: {
                position: createQueueDto.position,
                donation_number: createQueueDto.donation_number,
            },
        });

        if (positionTaken) {
            // If position is taken by an entry with null user_id, update it
            if (positionTaken.user_id === null) {
                positionTaken.user_id = createQueueDto.user_id;
                return this.queueRepository.save(positionTaken);
            } else {
                // Position is taken by another user
                throw new ConflictException('Position is already taken in this donation queue');
            }
        }

        // Create new queue entry
        const queue = this.queueRepository.create(createQueueDto);
        return this.queueRepository.save(queue);
    }

    async findAll(): Promise<Queue[]> {
        return this.queueRepository.find({
            relations: ['user'],
            order: { position: 'ASC' },
        });
    }

    async findByDonationNumber(donationNumber: number): Promise<Queue[]> {
        return this.queueRepository.find({
            where: { donation_number: donationNumber },
            relations: ['user'],
            order: { position: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Queue> {
        const queue = await this.queueRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!queue) {
            throw new NotFoundException('Queue entry not found');
        }

        return queue;
    }

    async findByUserId(userId: string): Promise<Queue[]> {
        return this.queueRepository.find({
            where: { user_id: userId },
            relations: ['user'],
            order: { donation_number: 'DESC', position: 'ASC' },
        });
    }

    async update(id: string, updateQueueDto: UpdateQueueDto): Promise<Queue> {
        const queue = await this.findOne(id);

        // If updating position, check if new position is available
        if (updateQueueDto.position && updateQueueDto.position !== queue.position) {
            const positionTaken = await this.queueRepository.findOne({
                where: {
                    position: updateQueueDto.position,
                    donation_number: queue.donation_number,
                },
            });

            if (positionTaken && positionTaken.id !== id) {
                throw new ConflictException('Position is already taken in this donation queue');
            }
        }

        Object.assign(queue, updateQueueDto);
        return this.queueRepository.save(queue);
    }

    async remove(id: string): Promise<{ message: string }> {
        const queue = await this.findOne(id);
        
        if (!queue.user_id) {
            throw new NotFoundException('Queue entry has no user to remove');
        }

        const userIdToRemove = queue.user_id;
        
        // Set user_id to null
        queue.user_id = null;
        queue.user = null;
        
        // Add the removed user to passed_user_ids
        const passedUserIds = queue.passed_user_ids || [];
        passedUserIds.push(userIdToRemove);
        queue.passed_user_ids = passedUserIds;
        
        await this.queueRepository.save(queue);
        return { message: 'User successfully removed from queue' };
    }

    async removeByUserId(userId: string, donationNumber: number): Promise<{ message: string }> {
        const queue = await this.queueRepository.findOne({
            where: {
                user_id: userId,
                donation_number: donationNumber,
            },
        });

        if (!queue) {
            throw new NotFoundException('User not found in this donation queue');
        }

        // Set user_id to null
        queue.user_id = null;
        queue.user = null;
        
        // Add the removed user to passed_user_ids
        const passedUserIds = queue.passed_user_ids || [];
        passedUserIds.push(userId);
        queue.passed_user_ids = passedUserIds;
        
        await this.queueRepository.save(queue);
        return { message: 'Successfully left the donation queue' };
    }

    async getCurrentReceiver(donationNumber: number): Promise<Queue | null> {
        return this.queueRepository.findOne({
            where: {
                donation_number: donationNumber,
                is_receiver: true,
            },
            relations: ['user'],
        });
    }


    async getQueuePosition(userId: string, donationNumber: number): Promise<number | null> {
        const queue = await this.queueRepository.findOne({
            where: {
                user_id: userId,
                donation_number: donationNumber,
            },
        });

        return queue ? queue.position : null;
    }

    async getQueueStats(donationNumber: number): Promise<{
        totalUsers: number;
        currentReceiver: Queue | null;
        nextInLine: Queue | null;
    }> {
        const queues = await this.findByDonationNumber(donationNumber);
        const currentReceiver = await this.getCurrentReceiver(donationNumber);
        
        let nextInLine = null;
        if (currentReceiver) {
            nextInLine = queues.find(q => q.position === currentReceiver.position + 1) || null;
        } else if (queues.length > 0) {
            nextInLine = queues[0];
        }

        return {
            totalUsers: queues.length,
            currentReceiver,
            nextInLine,
        };
    }

    async reorderQueue(donationNumber: number, newOrder: { id: string; position: number }[]): Promise<Queue[]> {
        // Validate that all positions are unique and sequential
        const positions = newOrder.map(item => item.position).sort((a, b) => a - b);
        for (let i = 0; i < positions.length; i++) {
            if (positions[i] !== i + 1) {
                throw new BadRequestException('Positions must be sequential starting from 1');
            }
        }

        // Update positions
        const updatePromises = newOrder.map(item =>
            this.queueRepository.update(
                { id: item.id, donation_number: donationNumber },
                { position: item.position }
            )
        );

        await Promise.all(updatePromises);

        return this.findByDonationNumber(donationNumber);
    }
}
