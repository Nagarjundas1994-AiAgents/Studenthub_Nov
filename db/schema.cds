namespace studenthub_nov;

using {cuid,managed} from '@sap/cds/common';

// entity Student : cuid,managed {
//   key ID: UUID;
//   Name: String(20);
//   Email: String(100);
//   department: String(50);
//   status: String(20);
//   bpNumber: String(20);
//   enrollments : Composition of many Enrollments on enrollments.student = $self;
// }


// entity Enrollments :cuid, managed{
//   key ID: UUID;
//   student : Association to Student;
//   course : Association to Course;
// }


// entity Course : managed{
//     key code     : String(10);
//       title    : String(100);
//       credits  : Integer ;   
//       capacity : Integer   ; 
//       teacher  : String(100);
// }

entity Student : managed {
  key ID: UUID;
  Name: String(20);
  Email: String(100);
  department: String(50);
  status: String(20);
  bpNumber: String(20);

  enrollments : Composition of many Enrollments
    on enrollments.student = $self;
}

entity Enrollments : cuid, managed {
  student : Association to Student;
  course  : Association to Course;
}

entity Course : managed {
  key code     : String(10);
  title        : String(100);
  credits      : Integer;
  capacity     : Integer;
  teacher      : String(100);
}