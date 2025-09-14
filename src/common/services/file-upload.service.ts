import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FileUploadService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'comprovantes');
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    constructor() {
        this.ensureUploadDirectoryExists();
    }

    /**
     * Upload a file and return its URL
     */
    async uploadFile(
        file: any,
        subfolder: string = '',
    ): Promise<string> {
        this.validateFile(file);

        const fileName = this.generateUniqueFileName(file.originalname);
        const relativePath = path.join('comprovantes', subfolder, fileName);
        const fullPath = path.join(this.uploadDir, subfolder, fileName);

        // Ensure subfolder exists
        await this.ensureDirectoryExists(path.dirname(fullPath));

        // Write file to disk
        await fs.writeFile(fullPath, file.buffer);

        // Return URL (in production, this would be a CDN URL)
        return `/uploads/${relativePath.replace(/\\/g, '/')}`;
    }

    /**
     * Delete a file by its relative path
     */
    async deleteFile(relativePath: string): Promise<void> {
        try {
            const fullPath = path.join(process.cwd(), relativePath);
            await fs.unlink(fullPath);
        } catch (error) {
            // File might not exist, which is fine
            console.warn(`Failed to delete file ${relativePath}:`, error.message);
        }
    }

    /**
     * Validate file before upload
     */
    private validateFile(file: any): void {
        if (!file) {
            throw new BadRequestException('Arquivo não fornecido');
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException('Arquivo muito grande. Máximo 5MB permitido');
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipo de arquivo não permitido. Apenas JPG e PNG são aceitos');
        }
    }

    /**
     * Generate a unique filename to avoid conflicts
     */
    private generateUniqueFileName(originalName: string): string {
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');

        return `${baseName}_${timestamp}_${random}${extension}`;
    }

    /**
     * Ensure upload directory exists
     */
    private async ensureUploadDirectoryExists(): Promise<void> {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Ensure a specific directory exists
     */
    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Get full path for a relative path
     */
    getFullPath(relativePath: string): string {
        return path.join(process.cwd(), relativePath);
    }
}
