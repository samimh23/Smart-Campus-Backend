// courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { User } from 'src/user/entities/user.entity';
import { Classe } from 'src/classe/entities/classe.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, User, Classe, Subject]), // Add all entities here
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // If other modules need to use CoursesService
})
export class CoursesModule {}