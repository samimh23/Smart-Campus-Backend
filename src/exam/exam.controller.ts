import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Protect } from 'src/auth/auth-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decoratir';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @UseGuards(Protect)
  @Roles(UserRole.STUDENT)
  @Post()
  create(@Body() data: any, @CurrentUser() user) {
    return this.examService.create(data.topic, user);
  }
  @Post('/chat')
  chat(@Body() data: any) {
    return this.examService.chat(data.question, data.messages);
  }
  @Post('/check')
  check(@Body() data: any) {
    return this.examService.check(data.question, data.expectedAnswer, data.studentAnswer);
  }

  @UseGuards(Protect)
  @Roles(UserRole.STUDENT)
  @Get()
  findAll(@CurrentUser() user) {
    return this.examService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examService.update(+id, updateExamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examService.remove(+id);
  }
}
