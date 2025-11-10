// import controller
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { GroqService } from 'src/groq.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('ai-explain')
export class ExplainController {
    constructor(private readonly groqService: GroqService) {}
    
    @Post('explain-image')
    async explainImage(@Body() body: { prompt: string; imageUrl: string }) {
        const { prompt, imageUrl } = body;
        
        try {
            // Extract filename from URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            // Read image file from uploads folder
            const uploadsPath = path.join(process.cwd(), 'uploads', fileName);
            
            if (!fs.existsSync(uploadsPath)) {
                throw new Error('Image file not found on server');
            }
            
            // Read file as base64
            const imageBuffer = fs.readFileSync(uploadsPath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(fileName);
            const dataUrl = `data:${mimeType};base64,${base64Image}`;
            
            // Call groq with base64 image
            return this.groqService.explainImage(dataUrl, prompt);
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    }
    
    private getMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        return mimeTypes[ext || ''] || 'image/jpeg';
    }
}