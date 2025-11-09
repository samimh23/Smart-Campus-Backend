import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { UserModule } from '../user/user.module'; 

@Module({
  imports: [TypeOrmModule.forFeature([Subject]), UserModule,],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}
