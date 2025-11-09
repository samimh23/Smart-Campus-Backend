import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RefreshToken } from './refreshtoken.entity';
import { UserRole } from './role.enum';
import { Lesson } from './lesson.entity';
import { Exercise } from './exercise.entity';
import { UserProgress } from './user-progress.entity';
import { UserSubmission } from './user-submission.entity';
import { UserAchievement } from './achievement.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true, nullable: true })
  username: string;
  
  @Column()
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: number;

  @Column({ default: false })
  is_active: Boolean;

  @Column({ nullable: true })
  geminiApiKey?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  completedExercises: number;

  @Column({ default: 0 })
  totalProgress: number; // Renamed from 'progress' to avoid conflict

  @Column({ nullable: true })
  resetCode: string;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeExpiry: Date;

  // Relations
  @OneToMany(() => Lesson, (lesson) => lesson.user)
  lessons: Lesson[];

  @OneToMany(() => Exercise, (exercise) => exercise.user)
  exercises: Exercise[];

  @OneToMany(() => UserProgress, (progress) => progress.user)
  userProgressRecords: UserProgress[]; // Renamed to avoid conflict

  @OneToMany(() => UserSubmission, (submission) => submission.user)
  submissions: UserSubmission[];

  @OneToMany(() => UserAchievement, (achievement) => achievement.user)
  achievements: UserAchievement[];
}