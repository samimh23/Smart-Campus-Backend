import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Protect } from 'src/auth/auth-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decoratir';

@UseGuards(Protect)
@Roles(UserRole.STUDENT)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  create(@Body() data: any, @CurrentUser() user) {
    console.log(data)
    return this.quizService.generateQuiz(data.usermsg, user.id);
  }

  @Post(':id/complete')
  markCompleted(@Param('id') id: number, @Body() data: any) {
    return this.quizService.markCompleted(id, data);
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.quizService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.quizService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizService.update(+id, updateQuizDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quizService.remove(+id);
  }
}
