import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { HomeworkSubmission } from './homework-submission.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => HomeworkSubmission, { eager: true })
  @JoinColumn({ name: 'submission_id' })
  submission: HomeworkSubmission;

  @Column()
  submission_id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column()
  teacher_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  grade: number;

  @Column('text', { nullable: true })
  feedback: string;

  @Column({ default: false })
  is_final: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
