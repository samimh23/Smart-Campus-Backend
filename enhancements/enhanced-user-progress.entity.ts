// Enhanced User Progress Entity
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../src/user/entities/user.entity';

@Entity('enhanced_user_progress')
export class EnhancedUserProgress {
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

  // Enhanced progress metrics
  @Column({ default: 0 })
  totalLessons: number;

  @Column({ default: 0 })
  completedLessons: number;

  @Column({ default: 0 })
  totalExercises: number;

  @Column({ default: 0 })
  completedExercises: number;

  @Column({ default: 0 })
  totalTimeSpent: number; // in minutes

  @Column({ default: 1 })
  currentLevel: number;

  @Column({ default: 0 })
  experiencePoints: number;

  @Column({ default: 0 })
  streak: number; // consecutive days

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
