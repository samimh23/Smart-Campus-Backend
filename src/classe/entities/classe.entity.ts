import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from 'src/cours/entities/course.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Classe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g. "1st Year A" or "2nd Year B"

  @Column({ nullable: true })
  level?: string; // optional, e.g. "1st Year", "2nd Year"

  // We'll connect courses later
  @ManyToMany(() => Course, (course) => course.classes)
  courses: Course[];

   @ManyToMany(() => Subject)
  @JoinTable()
  subjects: Subject[];


   @OneToMany(() => User, (user) => user.classe)
  students: User[];



   @ManyToOne(() => User, (user) => user.teacherClasses, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ nullable: true })
  teacher_id: number;


  @Column({ type: 'json', nullable: true })
  subject_teachers: { subjectId: number; teacherId: number }[];
}
