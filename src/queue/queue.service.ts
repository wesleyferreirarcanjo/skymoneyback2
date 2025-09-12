import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Queue } from './entities/queue.entity';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueueService {
    constructor(
        @InjectRepository(Queue)
        private queueRepository: Repository<Queue>,
        @InjectDataSource()
        private dataSource: DataSource,
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

    async swapPositions(firstUserId: string, secondUserId: string): Promise<{ message: string; updatedQueues: Queue[] }> {
        // Find all queue entries for both users
        const firstUserQueues = await this.queueRepository.find({
            where: { user_id: firstUserId },
            relations: ['user'],
        });

        const secondUserQueues = await this.queueRepository.find({
            where: { user_id: secondUserId },
            relations: ['user'],
        });

        if (firstUserQueues.length === 0) {
            throw new NotFoundException(`User ${firstUserId} not found in any queue`);
        }

        if (secondUserQueues.length === 0) {
            throw new NotFoundException(`User ${secondUserId} not found in any queue`);
        }

        // Find queues where both users are present (same donation_number)
        const commonDonationNumbers = firstUserQueues
            .map(q => q.donation_number)
            .filter(donationNumber => 
                secondUserQueues.some(q => q.donation_number === donationNumber)
            );

        if (commonDonationNumbers.length === 0) {
            throw new BadRequestException('Users are not in the same donation queue');
        }

        // Swap positions in all common donation queues
        const updatedQueues: Queue[] = [];
        
        for (const donationNumber of commonDonationNumbers) {
            const firstQueue = firstUserQueues.find(q => q.donation_number === donationNumber);
            const secondQueue = secondUserQueues.find(q => q.donation_number === donationNumber);

            if (firstQueue && secondQueue) {
                // Swap positions
                const tempPosition = firstQueue.position;
                firstQueue.position = secondQueue.position;
                secondQueue.position = tempPosition;

                // Save both entries
                await this.queueRepository.save([firstQueue, secondQueue]);
                updatedQueues.push(firstQueue, secondQueue);
            }
        }

        return {
            message: `Successfully swapped positions for users in ${commonDonationNumbers.length} donation queue(s)`,
            updatedQueues
        };
    }

    /**
     * Move the current receiver to the end of the queue using a transaction
     * This is a "godown" operation where the receiver goes to the back
     */
    async moveReceiverToEnd(donationNumber: number): Promise<{ message: string; updatedQueues: Queue[] }> {
        return await this.dataSource.transaction(async (manager) => {
            // Get current receiver
            const currentReceiver = await manager.findOne(Queue, {
                where: {
                    donation_number: donationNumber,
                    is_receiver: true,
                },
                relations: ['user'],
            });

            if (!currentReceiver) {
                throw new NotFoundException('No current receiver found for this donation queue');
            }

            // Get all queue entries for this donation number, ordered by position
            const allQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            if (allQueues.length <= 1) {
                throw new BadRequestException('Cannot move receiver to end - only one person in queue');
            }

            // Find the last position
            const lastPosition = Math.max(...allQueues.map(q => q.position));

            // Update the current receiver to not be receiver anymore
            currentReceiver.is_receiver = false;
            currentReceiver.position = lastPosition + 1;

            // Set the next person in line as the new receiver
            const nextInLine = allQueues.find(q => q.position === currentReceiver.position + 1);
            if (nextInLine) {
                nextInLine.is_receiver = true;
            }

            // Save all changes
            await manager.save([currentReceiver, nextInLine]);

            // Get updated queue
            const updatedQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            return {
                message: `Successfully moved receiver to end of queue. New receiver is at position ${nextInLine?.position}`,
                updatedQueues
            };
        });
    }

    /**
     * Move a user one position up in the queue using a transaction
     * This is a "godown" operation where users move up one position
     */
    async moveUserUpOnePosition(userId: string, donationNumber: number): Promise<{ message: string; updatedQueues: Queue[] }> {
        return await this.dataSource.transaction(async (manager) => {
            // Find the user's current position
            const userQueue = await manager.findOne(Queue, {
                where: {
                    user_id: userId,
                    donation_number: donationNumber,
                },
                relations: ['user'],
            });

            if (!userQueue) {
                throw new NotFoundException('User not found in this donation queue');
            }

            // Get all queue entries for this donation number, ordered by position
            const allQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            // Find the user above (one position higher)
            const userAbove = allQueues.find(q => q.position === userQueue.position - 1);

            if (!userAbove) {
                throw new BadRequestException('User is already at the top of the queue');
            }

            // Swap positions
            const tempPosition = userQueue.position;
            userQueue.position = userAbove.position;
            userAbove.position = tempPosition;

            // Save both entries
            await manager.save([userQueue, userAbove]);

            // Get updated queue
            const updatedQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            return {
                message: `Successfully moved user up one position from ${tempPosition} to ${userQueue.position}`,
                updatedQueues
            };
        });
    }

    /**
     * Move a user one position down in the queue using a transaction
     * This is a "godown" operation where users move down one position
     */
    async moveUserDownOnePosition(userId: string, donationNumber: number): Promise<{ message: string; updatedQueues: Queue[] }> {
        return await this.dataSource.transaction(async (manager) => {
            // Find the user's current position
            const userQueue = await manager.findOne(Queue, {
                where: {
                    user_id: userId,
                    donation_number: donationNumber,
                },
                relations: ['user'],
            });

            if (!userQueue) {
                throw new NotFoundException('User not found in this donation queue');
            }

            // Get all queue entries for this donation number, ordered by position
            const allQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            // Find the user below (one position lower)
            const userBelow = allQueues.find(q => q.position === userQueue.position + 1);

            if (!userBelow) {
                throw new BadRequestException('User is already at the bottom of the queue');
            }

            // Swap positions
            const tempPosition = userQueue.position;
            userQueue.position = userBelow.position;
            userBelow.position = tempPosition;

            // Save both entries
            await manager.save([userQueue, userBelow]);

            // Get updated queue
            const updatedQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            return {
                message: `Successfully moved user down one position from ${tempPosition} to ${userQueue.position}`,
                updatedQueues
            };
        });
    }

    /**
     * Get the next person in line to become receiver
     */
    async getNextReceiver(donationNumber: number): Promise<Queue | null> {
        const queues = await this.findByDonationNumber(donationNumber);
        const currentReceiver = await this.getCurrentReceiver(donationNumber);
        
        if (currentReceiver) {
            return queues.find(q => q.position === currentReceiver.position + 1) || null;
        } else if (queues.length > 0) {
            return queues[0];
        }
        
        return null;
    }

    /**
     * Advance the queue by making the next person the receiver
     */
    async advanceQueue(donationNumber: number): Promise<{ message: string; newReceiver: Queue | null; updatedQueues: Queue[] }> {
        return await this.dataSource.transaction(async (manager) => {
            const currentReceiver = await manager.findOne(Queue, {
                where: {
                    donation_number: donationNumber,
                    is_receiver: true,
                },
            });

            const nextReceiver = await this.getNextReceiver(donationNumber);

            if (!nextReceiver) {
                throw new BadRequestException('No next receiver found in queue');
            }

            // Update current receiver
            if (currentReceiver) {
                currentReceiver.is_receiver = false;
                await manager.save(currentReceiver);
            }

            // Set next receiver
            nextReceiver.is_receiver = true;
            await manager.save(nextReceiver);

            // Get updated queue
            const updatedQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            return {
                message: `Queue advanced. New receiver is at position ${nextReceiver.position}`,
                newReceiver: nextReceiver,
                updatedQueues
            };
        });
    }

    /**
     * Move a specific user to the end of the queue and move everyone else up one position
     * This is a "godown" operation where the specified user goes to the back
     */
    async moveUserToEnd(userId: string, donationNumber: number): Promise<{ message: string; updatedQueues: Queue[] }> {
        return await this.dataSource.transaction(async (manager) => {
            // Find the user's current position
            const userQueue = await manager.findOne(Queue, {
                where: {
                    user_id: userId,
                    donation_number: donationNumber,
                },
                relations: ['user'],
            });

            if (!userQueue) {
                throw new NotFoundException('User not found in this donation queue');
            }

            // Get all queue entries for this donation number, ordered by position
            const allQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            if (allQueues.length <= 1) {
                throw new BadRequestException('Cannot move user to end - only one person in queue');
            }

            // Find the last position
            const lastPosition = Math.max(...allQueues.map(q => q.position));

            // Store the user's current position
            const userCurrentPosition = userQueue.position;

            // Move the user to the end
            userQueue.position = lastPosition + 1;

            // Move everyone who was after the user up one position
            const queuesToUpdate = allQueues.filter(q => q.position > userCurrentPosition);
            
            // Update positions for users who need to move up
            for (const queue of queuesToUpdate) {
                queue.position = queue.position - 1;
            }

            // If the user was the current receiver, set the next person as receiver
            if (userQueue.is_receiver) {
                userQueue.is_receiver = false;
                // Find the new receiver (person at the user's old position)
                const newReceiver = queuesToUpdate.find(q => q.position === userCurrentPosition);
                if (newReceiver) {
                    newReceiver.is_receiver = true;
                }
            }

            // Save all changes
            const allUpdates = [userQueue, ...queuesToUpdate];
            await manager.save(allUpdates);

            // Get updated queue
            const updatedQueues = await manager.find(Queue, {
                where: { donation_number: donationNumber },
                order: { position: 'ASC' },
                relations: ['user'],
            });

            return {
                message: `Successfully moved user to end of queue from position ${userCurrentPosition} to ${userQueue.position}. ${queuesToUpdate.length} users moved up one position.`,
                updatedQueues
            };
        });
    }
}
