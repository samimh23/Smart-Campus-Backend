import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz]), AuthModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
