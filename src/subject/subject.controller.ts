import { Controller, Post, Get, Param, Body, Delete, Put } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';

@Controller('subjects') // 👈 not "subject", so route is /subjects
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  async create(@Body() body: { name: string }) {
    return this.subjectService.create(body.name);
  }

  @Get()
  async findAll() {
    return this.subjectService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subjectService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name: string }) {
    return this.subjectService.update(+id, body.name);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.subjectService.delete(+id);
  }


  @Get(':id/teachers')
async getTeachers(@Param('id') id: string) {
  return this.subjectService.getTeachersBySubject(+id);
}
}
