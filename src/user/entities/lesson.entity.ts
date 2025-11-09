// lesson.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exercise } from './exercise.entity';
import { User } from './user.entity';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column('jsonb')
  examples: string[];

  @Column()
  language: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => User, (user) => user.lessons, { nullable: true })
  user: User;

  @OneToMany(() => Exercise, (exercise) => exercise.lesson)
  exercises: Exercise[];

  // 🕐 Add these timestamp columns
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}