import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RefreshToken } from './refreshtoken.entity';
import { UserRole } from './role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: 'enum', enum: UserRole })
  role: UserRole
  
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

  // @OneToMany(() => RefreshToken, (token) => token.user)
  // refreshTokens: RefreshToken[]



   @Column({ nullable: true })
  resetCode: string;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeExpiry: Date;
}