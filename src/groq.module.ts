import { Module, Global } from '@nestjs/common';
import { GroqService } from './groq.service';

@Global() // 👈 This makes the module available globally
@Module({
  providers: [GroqService],
  exports: [GroqService], // 👈 Export it so other modules can use it
})
export class GroqModule {}