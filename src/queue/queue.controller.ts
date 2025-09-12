import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ClassSerializerInterceptor,
    UseInterceptors,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('queue')
@UseInterceptors(ClassSerializerInterceptor)
export class QueueController {
    constructor(private readonly queueService: QueueService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createQueueDto: CreateQueueDto) {
        return this.queueService.create(createQueueDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.queueService.findAll();
    }

    @Get('donation/:donationNumber')
    @UseGuards(JwtAuthGuard)
    findByDonationNumber(@Param('donationNumber', ParseIntPipe) donationNumber: number) {
        return this.queueService.findByDonationNumber(donationNumber);
    }

    @Get('my-queues')
    @UseGuards(JwtAuthGuard)
    findMyQueues(@Request() req) {
        return this.queueService.findByUserId(req.user.id);
    }

    @Get('stats/:donationNumber')
    @UseGuards(JwtAuthGuard)
    getQueueStats(@Param('donationNumber', ParseIntPipe) donationNumber: number) {
        return this.queueService.getQueueStats(donationNumber);
    }

    @Get('position/:donationNumber')
    @UseGuards(JwtAuthGuard)
    getMyPosition(
        @Request() req,
        @Param('donationNumber', ParseIntPipe) donationNumber: number,
    ) {
        return this.queueService.getQueuePosition(req.user.id, donationNumber);
    }

    @Get('current-receiver/:donationNumber')
    @UseGuards(JwtAuthGuard)
    getCurrentReceiver(@Param('donationNumber', ParseIntPipe) donationNumber: number) {
        return this.queueService.getCurrentReceiver(donationNumber);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.queueService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateQueueDto: UpdateQueueDto) {
        return this.queueService.update(id, updateQueueDto);
    }

    @Patch('set-receiver/:donationNumber/:userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    setReceiver(
        @Param('donationNumber', ParseIntPipe) donationNumber: number,
        @Param('userId') userId: string,
    ) {
        return this.queueService.setReceiver(donationNumber, userId);
    }

    @Patch('next-receiver/:donationNumber')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    moveToNextReceiver(@Param('donationNumber', ParseIntPipe) donationNumber: number) {
        return this.queueService.moveToNextReceiver(donationNumber);
    }

    @Patch('reorder/:donationNumber')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    reorderQueue(
        @Param('donationNumber', ParseIntPipe) donationNumber: number,
        @Body() newOrder: { id: string; position: number }[],
    ) {
        return this.queueService.reorderQueue(donationNumber, newOrder);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.queueService.remove(id);
    }

    @Delete('leave/:donationNumber')
    @UseGuards(JwtAuthGuard)
    leaveQueue(
        @Request() req,
        @Param('donationNumber', ParseIntPipe) donationNumber: number,
    ) {
        return this.queueService.removeByUserId(req.user.id, donationNumber);
    }
}
