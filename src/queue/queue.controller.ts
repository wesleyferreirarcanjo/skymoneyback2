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
    HttpCode,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { MoveUserPositionDto, MoveReceiverToEndDto, AdvanceQueueDto, MoveUserToEndDto } from './dto/godown-operations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('queue')
@UseInterceptors(ClassSerializerInterceptor)
export class QueueController {
    constructor(private readonly queueService: QueueService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
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

    @Patch('swap-positions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    swapPositions(@Body() swapData: { firstUserId: string; secondUserId: string }) {
        return this.queueService.swapPositions(swapData.firstUserId, swapData.secondUserId);
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

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    remove(@Param('id') id: string) {
        return this.queueService.remove(id);
    }

    @Delete('leave/:donationNumber')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    leaveQueue(
        @Request() req,
        @Param('donationNumber', ParseIntPipe) donationNumber: number,
    ) {
        return this.queueService.removeByUserId(req.user.id, donationNumber);
    }

    // Godown Operations - Queue Management with Transactions

    @Post('godown/move-receiver-to-end')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    moveReceiverToEnd(@Body() moveReceiverDto: MoveReceiverToEndDto) {
        return this.queueService.moveReceiverToEnd(moveReceiverDto.donation_number);
    }

    @Post('godown/move-user-up')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    moveUserUpOnePosition(@Body() moveUserDto: MoveUserPositionDto) {
        return this.queueService.moveUserUpOnePosition(moveUserDto.user_id, moveUserDto.donation_number);
    }

    @Post('godown/move-user-down')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    moveUserDownOnePosition(@Body() moveUserDto: MoveUserPositionDto) {
        return this.queueService.moveUserDownOnePosition(moveUserDto.user_id, moveUserDto.donation_number);
    }

    @Post('godown/advance-queue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    advanceQueue(@Body() advanceQueueDto: AdvanceQueueDto) {
        return this.queueService.advanceQueue(advanceQueueDto.donation_number);
    }

    @Get('godown/next-receiver/:donationNumber')
    @UseGuards(JwtAuthGuard)
    getNextReceiver(@Param('donationNumber', ParseIntPipe) donationNumber: number) {
        return this.queueService.getNextReceiver(donationNumber);
    }

    @Post('godown/move-user-to-end')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    moveUserToEnd(@Body() moveUserToEndDto: MoveUserToEndDto) {
        return this.queueService.moveUserToEnd(moveUserToEndDto.user_id, moveUserToEndDto.donation_number);
    }
}
