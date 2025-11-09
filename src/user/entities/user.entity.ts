import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { RefreshToken } from './refreshtoken.entity';
import { UserRole } from './role.enum';
import { Course } from 'src/cours/entities/course.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { Classe } from 'src/classe/entities/classe.entity';


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


  @OneToMany(() => Course, (course) => course.teacher)
  courses: Course[];

  @Column({ type: 'timestamp', nullable: true })
  resetCodeExpiry: Date;



    @ManyToMany(() => Subject, subject => subject.teachers, { cascade: true })
  @JoinTable() 
  subjects: Subject[];


  @ManyToOne(() => Classe, (classe) => classe.students, { nullable: true })
  @JoinColumn({ name: 'classe_id' })
  classe: Classe;

  @Column({ nullable: true })
  classe_id: number;

    @OneToMany(() => Classe, (classe) => classe.teacher)
  teacherClasses: Classe[];


  
   

}