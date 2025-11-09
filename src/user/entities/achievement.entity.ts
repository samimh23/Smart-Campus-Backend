import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum AchievementCategory {
  LEARNING = 'LEARNING',
  PRACTICE = 'PRACTICE',
  MASTERY = 'MASTERY',
  STREAK = 'STREAK',
  SPECIAL = 'SPECIAL'
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: AchievementCategory
  })
  category: AchievementCategory;

  @Column({ type: 'text' })
  criteria: string; // JSON string describing unlock criteria

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.achievements)
  user: User;

  @Column()
  achievementId: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: AchievementCategory
  })
  category: AchievementCategory;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  unlockedAt: Date;
}
