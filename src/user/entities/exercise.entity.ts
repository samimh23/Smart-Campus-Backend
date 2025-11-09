// exercise.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Lesson } from './lesson.entity';
import { UserSubmission } from './user-submission.entity';
import { User } from './user.entity';

@Entity()
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('text')
  starterCode: string;

  @Column({ nullable: true })
  expectedOutput: string;

  @Column('jsonb', { nullable: true })
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;

  @Column()
  language: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  lessonId?: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.exercises, { nullable: true })
  lesson: Lesson;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => User, (user) => user.exercises, { nullable: true })
  user: User;

  @OneToMany(() => UserSubmission, (submission) => submission.exercise)
  submissions: UserSubmission[];

  // 🕐 Add these timestamp columns
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}