// import controller
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { GroqService } from 'src/groq.service';

@Controller('ai-explain')
export class ExplainController {
    constructor(private readonly groqService: GroqService) {}
    @Post('explain-image')
    async explainImage(@Body() body: { prompt: string; imageUrl: string }) {
    const { prompt, imageUrl } = body;
        return this.groqService.explainImage(imageUrl, prompt);
    }
}