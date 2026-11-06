using { studenthub_nov as DB  } from '../db/schema';

service StudentService {
  entity Students as projection on DB.Student;
  entity Enrollments as projection on DB.Enrollments;
  entity Courses as projection on DB.Course;
}
