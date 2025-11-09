import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, UseGuards, NotFoundException } from '@nestjs/common';
import { ClasseService } from './classe.service';
import { Classe } from './entities/classe.entity';
import { Protect } from 'src/auth/auth-guard'; // ✅ if protected
import { UserRole } from 'src/user/entities/role.enum';
import { Roles } from 'src/auth/roles.decorator';


@Controller('classes')
export class ClasseController {
  constructor(private readonly classeService: ClasseService) {}

  @Post()
  create(@Body() body: { name: string; level?: string }): Promise<Classe> {
    return this.classeService.create(body.name, body.level);
  }

  @Get()
  findAll(): Promise<Classe[]> {
    return this.classeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Classe> {
    return this.classeService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name: string; level?: string }): Promise<Classe> {
    return this.classeService.update(+id, body.name, body.level);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.classeService.remove(+id);
  }



  @Post(':classeId/subjects/:subjectId')
  async addSubject(
    @Param('classeId', ParseIntPipe) classeId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ): Promise<Classe> {
    return this.classeService.addSubject(classeId, subjectId);
  }


   @Get(':classId/students/available')
  @UseGuards(Protect)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getAvailableStudents(@Param('classId', ParseIntPipe) classId: number) {
    return this.classeService.getAvailableStudents(classId);
  }



    @Post(':classId/add-students')
  @UseGuards(Protect)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async addStudentsToClass(
    @Param('classId') classId: number,
    @Body('studentIds') studentIds: number[],
  ) {
    return this.classeService.addStudentsToClass(classId, studentIds);
  }




  // In your ClasseController (classe.controller.ts)
@Delete(':classId/students/:studentId')
@UseGuards(Protect)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
async removeStudentFromClass(
  @Param('classId', ParseIntPipe) classId: number,
  @Param('studentId', ParseIntPipe) studentId: number,
) {
  return this.classeService.removeStudentFromClass(classId, studentId);
}

@Get(':classId/students')
@UseGuards(Protect)
async getClassStudents(@Param('classId', ParseIntPipe) classId: number) {
  const classe = await this.classeService.findOne(classId);
  return {
    students: classe.students || [],
    total: classe.students?.length || 0,
  };
}


@Get(':classId/subjects/available')
@UseGuards(Protect)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
async getAvailableSubjects(@Param('classId', ParseIntPipe) classId: number) {
  return this.classeService.getAvailableSubjects(classId);
}

@Post(':classId/subjects/:subjectId')
@UseGuards(Protect)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
async addSubjectToClass(
  @Param('classId', ParseIntPipe) classId: number,
  @Param('subjectId', ParseIntPipe) subjectId: number,
  @Body() body: { teacherId?: number }
): Promise<Classe> {
  return this.classeService.addSubjectToClass(classId, subjectId, body.teacherId);
}

@Delete(':classId/subjects/:subjectId')
@UseGuards(Protect)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
async removeSubjectFromClass(
  @Param('classId', ParseIntPipe) classId: number,
  @Param('subjectId', ParseIntPipe) subjectId: number,
) {
  return this.classeService.removeSubjectFromClass(classId, subjectId);
}



@Post(':classId/assign-teacher/:teacherId')
@UseGuards(Protect)
@Roles(UserRole.ADMIN)
async assignTeacherToClass(
  @Param('classId', ParseIntPipe) classId: number,
  @Param('teacherId', ParseIntPipe) teacherId: number,
) {
  return this.classeService.assignTeacherToClass(classId, teacherId);
}

@Delete(':classId/teacher')
@UseGuards(Protect)
@Roles(UserRole.ADMIN)
async removeTeacherFromClass(
  @Param('classId', ParseIntPipe) classId: number,
) {
  return this.classeService.removeTeacherFromClass(classId);
}

@Get('teacher/:teacherId')
@UseGuards(Protect)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
async getTeacherClasses(
  @Param('teacherId', ParseIntPipe) teacherId: number,
) {
  console.log('📞 GET /classes/teacher called with teacherId:', teacherId); // ✅ Add this
  
  try {
    const classes = await this.classeService.getTeacherClasses(teacherId);
    console.log('✅ Found classes:', classes); // ✅ Add this
    return classes;
  } catch (error) {
    console.error('❌ Error in getTeacherClasses:', error); // ✅ Add this
    throw error;
  }
}

@Get(':id/with-teachers')
@UseGuards(Protect)
async getClassWithTeachers(@Param('id', ParseIntPipe) classId: number) {
  return this.classeService.getClassWithTeachers(classId);
}

@Post(':classId/subjects/:subjectId/assign-teacher/:teacherId')
@UseGuards(Protect)
@Roles(UserRole.ADMIN)
async assignTeacherToSubject(
  @Param('classId', ParseIntPipe) classId: number,
  @Param('subjectId', ParseIntPipe) subjectId: number,
  @Param('teacherId', ParseIntPipe) teacherId: number,
) {
  return this.classeService.addSubjectToClassWithTeacher(classId, subjectId, teacherId);
}





@Get('teacher/:teacherId/by-subjects')
@UseGuards(Protect)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
async getTeacherClassesBySubjects(
  @Param('teacherId', ParseIntPipe) teacherId: number,
) {
  console.log('📞 GET /classes/teacher/by-subjects called with teacherId:', teacherId);
  
  try {
    const classes = await this.classeService.getTeacherClassesBySubjects(teacherId);
    console.log('✅ Found classes by subjects:', classes);
    return classes;
  } catch (error) {
    console.error('❌ Error in getTeacherClassesBySubjects:', error);
    throw error;
  }
}







@Get('student/:studentId/subjects')
@UseGuards(Protect)
@Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER)
async getStudentSubjects(
  @Param('studentId', ParseIntPipe) studentId: number,
) {
  return this.classeService.getStudentSubjects(studentId);
}



@Get('student/:studentId/class')
@UseGuards(Protect)
@Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER)
async getStudentClass(
  @Param('studentId', ParseIntPipe) studentId: number,
) {
  return this.classeService.getStudentClass(studentId);
}


}
