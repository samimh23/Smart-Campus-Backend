import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { Repository } from 'typeorm';
import { GroqService } from 'src/groq.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz) private readonly quizRepository: Repository<Quiz>,
    private readonly groqService: GroqService,
  ){}
  async generateQuiz(usermsg: string, userId: number) {
    try {
      console.log('🎯 Creating quiz for userId:', userId);
      // Generate quiz JSON from AI
      const quizJson = await this.groqService.createQuizJson(
        usermsg,
      );

      // Fetch user
      // const user = await this.userRepository.findOneBy({ id: userId });
      // if (!user) {
      //   throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      // }

      // Create and save quiz
      const quiz = this.quizRepository.create({
        subject: quizJson.subject,
        topic: quizJson.topic,
        difficulty: quizJson.difficulty,
        language: quizJson.language,
        questions: quizJson.questions, // store only questions
        user: { id: userId },
      });

      return await this.quizRepository.save(quiz);
    } catch (err) {
      console.error('❌ Error generating quiz:', err);
      throw new HttpException(
        'Failed to generate quiz. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(userId: number) {
    try {
      console.log('🔍 Finding quizzes for userId:', userId);
      const quizes = await this.quizRepository.find({ where: { user: { id: userId } } });
      console.log('✅ Found quizzes:', quizes.length);
      return quizes;
    } catch (error) {
      console.error('❌ Error finding quizzes:', error);
      throw new HttpException(
        'Failed to retreive quiz. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async markCompleted(id: number, data) {
    try {
      return await this.quizRepository.update(id, { done: true, correctAnswer: data.correct, wrongAnswer: data.wrong, spentTime: data.time });
    } catch (error) {
      throw new HttpException(
        'Failed to update quiz. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );      
    }
  }

  async findOne(id: number) {
    try {
      return await this.quizRepository.findOne({ where: { id } })
    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      throw new HttpException(
        'Failed to retreive quiz. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: number, updateQuizDto: UpdateQuizDto) {
    return `This action updates a #${id} quiz`;
  }

  remove(id: number) {
    return `This action removes a #${id} quiz`;
  }
}
