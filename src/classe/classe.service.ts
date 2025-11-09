import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Classe } from './entities/classe.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/user/entities/role.enum';

@Injectable()
export class ClasseService {
  constructor(
    @InjectRepository(Classe)
    private classeRepo: Repository<Classe>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(name: string, level?: string): Promise<Classe> {
    const classe = this.classeRepo.create({ name, level });
    return this.classeRepo.save(classe);
  }

  async findAll(): Promise<Classe[]> {
    return this.classeRepo.find({
      relations: ['students', 'subjects'],
    });
  }

  async findOne(id: number): Promise<Classe> {
    const classe = await this.classeRepo.findOne({ 
      where: { id },
      relations: ['students', 'subjects'],
    });
    if (!classe) throw new NotFoundException('Classe not found');
    return classe;
  }

  async update(id: number, name: string, level?: string): Promise<Classe> {
    const classe = await this.findOne(id);
    classe.name = name;
    classe.level = level;
    return this.classeRepo.save(classe);
  }

  async remove(id: number): Promise<void> {
    const classe = await this.findOne(id);
    
    // ✅ Remove class reference from all students first
    if (classe.students && classe.students.length > 0) {
      await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ classe_id: null })
        .where('classe_id = :classId', { classId: id })
        .execute();
    }
    
    await this.classeRepo.remove(classe);
  }

  async addSubject(classId: number, subjectId: number) {
    const classe = await this.classeRepo.findOne({ 
      where: { id: classId }, 
      relations: ['subjects'] 
    });
    if (!classe) throw new NotFoundException('Classe not found');

    const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');

    if (!classe.subjects) {
      classe.subjects = [];
    }

    classe.subjects.push(subject);
    return this.classeRepo.save(classe);
  }

  async getAvailableStudents(classId: number) {
    // ✅ Get students who are not in ANY class or are in this specific class
    const allStudents = await this.userRepo.find({
      where: {
        role: UserRole.STUDENT,
      },
      select: ['id', 'first_name', 'last_name', 'email', 'username', 'is_active', 'classe_id']
    });

    const classe = await this.classeRepo.findOne({
      where: { id: classId },
      relations: ['students'],
    });

    if (!classe) {
      throw new NotFoundException('Class not found');
    }

    const currentStudentIds = classe.students?.map(student => student.id) || [];

    return {
      currentStudents: classe.students || [],
      availableStudents: allStudents.filter(student => 
        !student.classe_id || student.classe_id === classId
      ),
      currentStudentIds: currentStudentIds
    };
  }

  async addStudentsToClass(classId: number, studentIds: number[]) {
    const classe = await this.classeRepo.findOne({
      where: { id: classId },
      relations: ['students'],
    });

    if (!classe) throw new NotFoundException('Class not found');

    // ✅ Validate student IDs and check if they're already in other classes
    const students = await this.userRepo.findBy({
      id: In(studentIds),
      role: UserRole.STUDENT,
    });

    if (students.length !== studentIds.length) {
      const foundIds = students.map(s => s.id);
      const missingIds = studentIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Invalid student IDs: ${missingIds.join(', ')}`);
    }

    // ✅ Check for students already in other classes
    const studentsInOtherClasses = students.filter(student => 
      student.classe_id && student.classe_id !== classId
    );

    if (studentsInOtherClasses.length > 0) {
      const studentNames = studentsInOtherClasses.map(s => 
        `${s.first_name} ${s.last_name}`
      ).join(', ');
      throw new BadRequestException(
        `The following students are already in other classes: ${studentNames}`
      );
    }

    // ✅ Update students to belong to this class
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ classe_id: classId })
      .where('id IN (:...studentIds)', { studentIds })
      .execute();

    // ✅ Refresh the class with updated students
    const updatedClass = await this.classeRepo.findOne({
      where: { id: classId },
      relations: ['students'],
    });

    return {
      success: true,
      message: `${students.length} student(s) added successfully`,
      class: updatedClass,
      addedStudents: students,
    };
  }

  async removeStudentFromClass(classId: number, studentId: number) {
    const classe = await this.classeRepo.findOne({
      where: { id: classId },
      relations: ['students'],
    });

    if (!classe) throw new NotFoundException('Class not found');

    // ✅ Check if student is actually in this class
    const student = await this.userRepo.findOne({
      where: { id: studentId, classe_id: classId }
    });

    if (!student) {
      throw new BadRequestException('Student is not in this class');
    }

    // ✅ Remove student from class by setting classe_id to null
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ classe_id: null })
      .where('id = :studentId', { studentId })
      .execute();

    return {
      success: true,
      message: 'Student removed from class successfully',
    };
  }


  async getAvailableSubjects(classId: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['subjects'],
  });

  if (!classe) {
    throw new NotFoundException('Class not found');
  }

  const allSubjects = await this.subjectRepo.find({
    relations: ['teachers'],
  });

  const currentSubjectIds = classe.subjects?.map(subject => subject.id) || [];

  return {
    currentSubjects: classe.subjects || [],
    availableSubjects: allSubjects,
    currentSubjectIds: currentSubjectIds
  };
}




async addSubjectToClass(classId: number, subjectId: number, teacherId?: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['subjects'],
  });

  if (!classe) throw new NotFoundException('Class not found');

  const subject = await this.subjectRepo.findOne({
    where: { id: subjectId },
    relations: ['teachers'],
  });

  if (!subject) throw new NotFoundException('Subject not found');

  // Check if subject is already assigned to class
  if (classe.subjects?.some(s => s.id === subjectId)) {
    throw new BadRequestException('Subject is already assigned to this class');
  }

  // If teacher is specified, validate they can teach this subject
  if (teacherId) {
    const teacher = await this.userRepo.findOne({
      where: { 
        id: teacherId, 
        role: UserRole.TEACHER 
      },
      relations: ['subjects'],
    });

    if (!teacher) {
      throw new BadRequestException('Teacher not found or not a teacher');
    }

    // Check if teacher is qualified to teach this subject
    const canTeachSubject = teacher.subjects?.some(s => s.id === subjectId);
    if (!canTeachSubject) {
      throw new BadRequestException('This teacher is not qualified to teach the selected subject');
    }

    // Here you might want to store the teacher-subject-class relationship
    // For now, we'll just add the subject to the class
  }

  if (!classe.subjects) {
    classe.subjects = [];
  }

  classe.subjects.push(subject);
  return this.classeRepo.save(classe);
}

async removeSubjectFromClass(classId: number, subjectId: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['subjects'],
  });

  if (!classe) throw new NotFoundException('Class not found');

  classe.subjects = classe.subjects?.filter(subject => subject.id !== subjectId) || [];

  await this.classeRepo.save(classe);

  return {
    success: true,
    message: 'Subject removed from class successfully',
  };
}

async assignTeacherToClass(classId: number, teacherId: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['teacher'],
  });

  if (!classe) throw new NotFoundException('Class not found');

  const teacher = await this.userRepo.findOne({
    where: { 
      id: teacherId, 
      role: UserRole.TEACHER 
    },
  });

  if (!teacher) {
    throw new BadRequestException('Teacher not found or not a teacher');
  }

  // Vérifier si la classe a déjà un enseignant
  if (classe.teacher && classe.teacher.id !== teacherId) {
    throw new BadRequestException('This class already has a teacher assigned');
  }

  classe.teacher = teacher;
  await this.classeRepo.save(classe);

  return {
    success: true,
    message: `Teacher ${teacher.first_name} ${teacher.last_name} assigned to class ${classe.name}`,
    class: classe,
  };
}

async getTeacherClasses(teacherId: number) {
  const teacher = await this.userRepo.findOne({
    where: { 
      id: teacherId, 
      role: UserRole.TEACHER 
    },
    relations: ['teacherClasses', 'teacherClasses.students', 'teacherClasses.subjects'],
  });

  if (!teacher) {
    throw new NotFoundException('Teacher not found');
  }

  // Return empty array if no classes assigned
  return teacher.teacherClasses || [];
}

async removeTeacherFromClass(classId: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['teacher'],
  });

  if (!classe) throw new NotFoundException('Class not found');

  if (!classe.teacher) {
    throw new BadRequestException('This class has no teacher assigned');
  }

  classe.teacher = null;
  classe.teacher_id = null;
  await this.classeRepo.save(classe);

  return {
    success: true,
    message: 'Teacher removed from class successfully',
  };
}


async addSubjectToClassWithTeacher(classId: number, subjectId: number, teacherId: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['subjects', 'teacher'],
  });

  if (!classe) throw new NotFoundException('Class not found');

  const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
  if (!subject) throw new NotFoundException('Subject not found');

  const teacher = await this.userRepo.findOne({ 
    where: { id: teacherId, role: UserRole.TEACHER },
    relations: ['subjects']
  });
  if (!teacher) throw new BadRequestException('Teacher not found or not a teacher');

  // Check if teacher can teach this subject
  const canTeach = teacher.subjects?.some(s => s.id === subjectId);
  if (!canTeach) {
    throw new BadRequestException('This teacher is not qualified to teach the selected subject');
  }

  // Add subject to class if not already there
  if (!classe.subjects.some(s => s.id === subjectId)) {
    classe.subjects.push(subject);
  }

  // Store subject-teacher assignment
  if (!classe.subject_teachers) {
    classe.subject_teachers = [];
  }
  
  // Remove existing assignment for this subject if any
  classe.subject_teachers = classe.subject_teachers.filter(st => st.subjectId !== subjectId);
  
  // Add new assignment
  classe.subject_teachers.push({ subjectId, teacherId });

  await this.classeRepo.save(classe);

  return {
    success: true,
    message: `Subject ${subject.name} assigned to teacher ${teacher.first_name} ${teacher.last_name} in class ${classe.name}`,
    class: classe
  };
}

async getClassWithTeachers(classId: number) {
  const classe = await this.classeRepo.findOne({
    where: { id: classId },
    relations: ['subjects', 'students', 'teacher', 'subjects.teachers'],
  });

  if (!classe) throw new NotFoundException('Class not found');

  // Enhance the response with teacher information for each subject
  const enhancedSubjects = await Promise.all(
    (classe.subjects || []).map(async (subject) => {
      let assignedTeacher = null;
      
      // Find assigned teacher from subject_teachers
      if (classe.subject_teachers) {
        const assignment = classe.subject_teachers.find(st => st.subjectId === subject.id);
        if (assignment) {
          assignedTeacher = await this.userRepo.findOne({
            where: { id: assignment.teacherId },
            select: ['id', 'first_name', 'last_name', 'email']
          });
        }
      }

      return {
        ...subject,
        assignedTeacher
      };
    })
  );

  return {
    ...classe,
    subjects: enhancedSubjects
  };
}




async getTeacherClassesBySubjects(teacherId: number) {
  console.log('🔍 Searching for classes where teacher teaches subjects:', teacherId);
  
  // First verify the teacher exists
  const teacher = await this.userRepo.findOne({
    where: { 
      id: teacherId, 
      role: UserRole.TEACHER 
    }
  });

  if (!teacher) {
    throw new NotFoundException('Teacher not found');
  }

  // Find all classes
  const allClasses = await this.classeRepo.find({
    relations: ['students', 'subjects', 'teacher'],
  });

  // Filter classes where this teacher teaches any subject
  const teacherClasses = allClasses.filter(classe => {
    if (!classe.subject_teachers) return false;
    
    // Check if this teacher is assigned to any subject in this class
    return classe.subject_teachers.some(st => st.teacherId === teacherId);
  });

  console.log('✅ Found classes by subjects:', teacherClasses.length);
  
  return teacherClasses;
}
}