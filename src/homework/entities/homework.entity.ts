import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Homework {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  grade_level: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column()
  teacher_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}



