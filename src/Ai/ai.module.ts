// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [AIController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AIModule {}