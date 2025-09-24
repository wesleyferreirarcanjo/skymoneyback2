export class StartCycleDto {
    donationNumber: number; // which queue (donation_number)
    donorsCount: number; // how many donors per receiver (e.g., 3)
    amount: number; // base amount per donation
    type?: string; // optional donation type
    deadlineDays?: number; // optional deadline offset in days
}

export class StartCycleResponseDto {
    createdCount: number;
    skippedExisting: number;
    receiversProcessed: number;
}

