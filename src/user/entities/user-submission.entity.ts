// user-submission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Exercise } from './exercise.entity';

@Entity()
export class UserSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.submissions)
  user: User;

  @Column()
  exerciseId: string;

  @ManyToOne(() => Exercise, (exercise) => exercise.submissions)
  exercise: Exercise;

  @Column('text')
  userCode: string;

  @Column({ nullable: true })
  output: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column('jsonb')
  feedback: {
    message: string;
    suggestions: string[];
    improvements: string[];
  };

  @CreateDateColumn()
  createdAt: Date;
}