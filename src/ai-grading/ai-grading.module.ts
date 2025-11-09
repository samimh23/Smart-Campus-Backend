import { Module } from '@nestjs/common';
import { AIGradingService } from './ai-grading.service';

@Module({
  providers: [AIGradingService],
  exports: [AIGradingService],
})
export class AIGradingModule {}

