import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class RefreshToken{
    @PrimaryGeneratedColumn()
    id: number;
    
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User

    @Column()
    token: string

    // @CreateDateColumn()
    // createdAt: Date

    @Column()
    expiresAt: Date
}