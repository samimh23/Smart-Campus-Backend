// user-progress.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.userProgressRecords)
  user: User;

  @Column()
  language: string;

  @Column()
  subject: string;

  @Column({ default: 0 })
  completedExercises: number;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;
}