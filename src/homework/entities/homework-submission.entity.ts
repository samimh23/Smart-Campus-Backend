import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Homework } from './homework.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class HomeworkSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Homework, { eager: true })
  @JoinColumn({ name: 'homework_id' })
  homework: Homework;

  @Column()
  homework_id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column()
  student_id: number;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  attachment_url: string;

  @Column({ default: false })
  is_submitted: boolean;

  @Column({ nullable: true })
  submitted_at: Date;

  @Column({ default: false })
  is_late: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
