import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, ManyToMany, JoinColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Classe } from 'src/classe/entities/classe.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  // 👇 Add this to store uploaded file path (e.g. /uploads/courses/xxx.pdf)
  @Column({ nullable: true })
  filePath: string;



  @Column({ nullable: true })
  originalFileName: string; // Add this to store original file name

  @Column({ nullable: true })
  fileSize: number; // Add this to store file size

  @Column({ nullable: true })
  fileType: string; // Add this to store file type (pdf, docx, etc.)


  @ManyToOne(() => User, user => user.courses)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  teacherId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

@Column({ nullable: true })
  subject: string; 

  // Many courses can belong to many classes
  @ManyToMany(() => Classe, (classe) => classe.courses)
  @JoinTable()
  classes: Classe[];


   @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subjectRelation: Subject;

  
}