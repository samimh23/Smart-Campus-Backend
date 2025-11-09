// subject.controller.ts
import { Controller, Post, Get, Param, Body, Delete, Put, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';
import { Protect } from 'src/auth/auth-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/role.enum';
import { UserService } from 'src/user/user.service';

@Controller('subjects')
@UseGuards(Protect)
export class SubjectController {
  constructor(
    private readonly subjectService: SubjectService,
    private readonly userService: UserService // Inject UserService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: { name: string; teacherIds?: number[] }) {
    return this.subjectService.create(body.name, body.teacherIds);
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
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() body: { name: string }) {
    return this.subjectService.update(+id, body.name);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.subjectService.delete(+id);
  }

  @Get(':id/teachers')
  async getTeachers(@Param('id') id: string) {
    return this.subjectService.getTeachersBySubject(+id);
  }

  // Get available teachers for a subject
  @Get(':id/teachers/available')
  @Roles(UserRole.ADMIN)
  async getAvailableTeachers(@Param('id') id: string) {
    return this.subjectService.getAvailableTeachers(+id);
  }

  // Assign teachers to subject
  @Post(':id/teachers')
  @Roles(UserRole.ADMIN)
  async assignTeachers(
    @Param('id') id: string,
    @Body() body: { teacherIds: number[] }
  ) {
    return this.subjectService.assignTeachers(+id, body.teacherIds);
  }

  // Add single teacher to subject
  @Post(':id/teachers/:teacherId')
  @Roles(UserRole.ADMIN)
  async addTeacher(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string
  ) {
    return this.subjectService.addTeacher(+id, +teacherId);
  }

  // Remove teacher from subject
  @Delete(':id/teachers/:teacherId')
  @Roles(UserRole.ADMIN)
  async removeTeacher(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string
  ) {
    return this.subjectService.removeTeacher(+id, +teacherId);
  }

  // Get all teachers by role
  @Get('users/role/:role')
  @Roles(UserRole.ADMIN)
  async getUsersByRole(@Param('role') role: UserRole) {
    return this.userService.findByRole(role);
  }

  // Alternative endpoint to get all teachers (convenience method)
  @Get('teachers/all')
  @Roles(UserRole.ADMIN)
  async getAllTeachers() {
    return this.userService.findByRole(UserRole.TEACHER);
  }
}