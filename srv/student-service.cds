using {studenthub_nov as DB} from '../db/schema';

@requires: 'User'
service StudentService {
  entity Students    as projection on DB.Student
    actions {
      action   changeDepartment(Department: String) returns Students;
      //bound function to read the information bout enrolled courses for a student
      function getEnrolledCourses()                 returns array of Courses;

      //covert the stautes of a student to graduated
      @requires: ['Manager', 'Admin']
      action   graduateStudent()                           returns Students;

      //delete a student
      @requires: ['Admin']
      action   deleteStudent()                      returns Boolean;
    };


  entity Enrollments as projection on DB.Enrollments;


  entity Courses     as projection on DB.Course;

//unbound actions to create and update a student
  action updateStudent(name: String,
                       email: String,
                       department: String,
                       status: String,
                       ID: String,
                       bpNumber: String) returns Students;

  action createStudent(name: String,
                       email: String,
                       department: String,
                       status: String,
                       ID: String,
                       bpNumber: String) returns Students;


}
