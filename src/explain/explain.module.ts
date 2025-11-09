// generate module
import { Module } from '@nestjs/common';
import { ExplainController } from './explain.controller';
import { GroqModule } from 'src/groq.module';
@Module({
  imports: [GroqModule],
  controllers: [ExplainController],
})
export class ExplainModule {}