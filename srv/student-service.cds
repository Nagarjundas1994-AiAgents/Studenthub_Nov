using {studenthub_nov as DB} from '../db/schema';

@requires: 'User'
service StudentService {
  entity Students    as projection on DB.Student
    actions {
      action   changeDepartment(Department: String) returns Students;

      //bound function to read the information about enrolled courses for a student
      function getEnrolledCourses()                 returns array of Courses;

      //covert the stautes of a student to graduated
      @requires: ['Manager', 'Admin']
      action   graduateStudent()                           returns Students;

      //delete a student
      @requires: ['Admin']
      action   deleteStudent()                      returns Boolean;

      //enroll a student into a course
      action   enrollToCourse(courseCode: String)   returns Courses;

      //remove a student from a course
      action   dropCourse(courseCode: String)       returns Boolean;

      //change the status of a student to suspended
      action   suspendStudent()                     returns Students;

      //reactivate a suspended student
      action   activateStudent()                    returns Students;

      //average credits of all courses the student is enrolled in
      function getAverageCredits()                  returns Decimal(4, 1);
    }


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

//unbound functions to search and count students
  function getStudentsByDepartment(department: String) returns array of Students;

  function getStudentCount() returns Integer;


}
