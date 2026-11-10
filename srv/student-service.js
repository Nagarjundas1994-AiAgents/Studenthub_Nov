import cds from '@sap/cds';

const { Students, Enrollments, Courses } = cds.entities('StudentService');
const { SELECT, INSERT, UPDATE, DELETE } = cds.ql;

export default class StudentService extends cds.ApplicationService {
    async init() {

        this.on('deleteStudent', 'Students', async(req)=>
        {
            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Find student
            const student = await SELECT.one.from(Students).where({ ID });

            // Step 3: student present in database or not
             if (!student) {
                return req.reject(
                    404,
                    `Student with ID ${ID} not found`
                )};

            //Step 4: deleting the student from db
            await DELETE.from(Students).where({ID});

            return true;


        });
        this.on('changeDepartment', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Get Department from request body
            const { Department } = req.data;

            console.log("Student ID:", ID);
            console.log("New Department:", Department);

            // Step 3: Find student
            const student = await SELECT.one.from(Students).where({ ID });

            // Step 4: Check student exists
            if (!student) {
                return req.reject(
                    404,
                    `Student with ID ${ID} not found`
                );
            }

            // Step 5: Update department
            await this.run(UPDATE(Students).set({ department: Department }).where({ ID }) );

            // Step 6: Fetch updated student
            const updatedStudent = await SELECT.one
                .from(Students)
                .where({ ID });

            // Step 7: Return response
            return updatedStudent;
        });


        this.on('graduateStudent', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];
            // Step 2: Find student
            const student = await SELECT.one.from(Students).where({ ID });
            // Step 3: Check student exists
            if (!student) {
                return req.reject( 404,`Student with ID ${ID} not found` );
            }

            // Step 4: Update status to graduated
            await this.run(UPDATE(Students) .set({ status: 'Graduated' }).where({ ID }) );

            // Step 5: Fetch updated student
            const updatedStudent = await SELECT.one.from(Students).where({ ID });

            // Step 6: Return response
            return updatedStudent;
        });


        //bound function: read all courses a student is enrolled in

        this.on('getEnrolledCourses', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Check student exists
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 3: Find all enrollments of the student
            const enrollments = await SELECT.from(Enrollments).where({ student_ID: ID });

            // Step 4: No enrollments -> return an empty list
            if (!enrollments.length) {
                return [];
            }

            // Step 5: Read the courses of these enrollments
            const courseCodes = enrollments.map((enrollment) => enrollment.course_code);
            const courses = await SELECT.from(Courses)
                .where({ code: { in: courseCodes } })
                .orderBy('code');

            return courses;
        });


        //bound action: enroll a student into a course

        this.on('enrollToCourse', 'Students', async (req) => {

            // Step 1: Get Student ID from URL and course code from request body
            const { ID } = req.params[0];
            const { courseCode } = req.data;

            // Step 2: Validate input
            if (!courseCode) {
                return req.reject(400, 'Missing required field: courseCode');
            }

            // Step 3: Check student exists
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 4: Check course exists
            const course = await SELECT.one.from(Courses).where({ code: courseCode });
            if (!course) {
                return req.reject(404, `Course with code ${courseCode} not found`);
            }

            // Step 5: Check the student is not already enrolled
            const existingEnrollment = await SELECT.one.from(Enrollments)
                .where({ student_ID: ID, course_code: courseCode });
            if (existingEnrollment) {
                return req.reject(409, `Student ${ID} is already enrolled in course ${courseCode}`);
            }

            // Step 6: Check the course capacity
            if (course.capacity !== null && course.capacity !== undefined) {
                const enrollments = await SELECT.from(Enrollments)
                    .columns('ID')
                    .where({ course_code: courseCode });
                if (enrollments.length >= course.capacity) {
                    return req.reject(409, `Course ${courseCode} is full`);
                }
            }

            // Step 7: Create the enrollment
            await INSERT.into(Enrollments).entries({
                ID: cds.utils.uuid(),
                student_ID: ID,
                course_code: courseCode
            });

            // Step 8: Return the enrolled course
            return course;
        });


        //bound action: remove a student from a course

        this.on('dropCourse', 'Students', async (req) => {

            // Step 1: Get Student ID from URL and course code from request body
            const { ID } = req.params[0];
            const { courseCode } = req.data;

            // Step 2: Validate input
            if (!courseCode) {
                return req.reject(400, 'Missing required field: courseCode');
            }

            // Step 3: Check student exists
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 4: Find the enrollment
            const enrollment = await SELECT.one.from(Enrollments)
                .where({ student_ID: ID, course_code: courseCode });
            if (!enrollment) {
                return req.reject(404, `Student ${ID} is not enrolled in course ${courseCode}`);
            }

            // Step 5: Delete the enrollment
            await DELETE.from(Enrollments).where({ ID: enrollment.ID });

            return true;
        });


        //bound action: change the status of a student to suspended

        this.on('suspendStudent', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Find student
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 3: A graduated student cannot be suspended
            if (student.status === 'Graduated') {
                return req.reject(409, `Student with ID ${ID} has already graduated`);
            }

            // Step 4: Check the student is not suspended already
            if (student.status === 'Suspended') {
                return req.reject(409, `Student with ID ${ID} is already suspended`);
            }

            // Step 5: Update status to suspended
            await this.run(UPDATE(Students).set({ status: 'Suspended' }).where({ ID }));

            // Step 6: Return the updated student
            return await SELECT.one.from(Students).where({ ID });
        });


        //bound action: reactivate a suspended student

        this.on('activateStudent', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Find student
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 3: A graduated student cannot be reactivated
            if (student.status === 'Graduated') {
                return req.reject(409, `Student with ID ${ID} has already graduated`);
            }

            // Step 4: Check the student is not active already
            if (student.status === 'Active') {
                return req.reject(409, `Student with ID ${ID} is already active`);
            }

            // Step 5: Update status to active
            await this.run(UPDATE(Students).set({ status: 'Active' }).where({ ID }));

            // Step 6: Return the updated student
            return await SELECT.one.from(Students).where({ ID });
        });


        //bound function: average credits of the courses a student is enrolled in

        this.on('getAverageCredits', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Check student exists
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 3: Find all enrollments of the student
            const enrollments = await SELECT.from(Enrollments).where({ student_ID: ID });
            if (!enrollments.length) {
                return 0;
            }

            // Step 4: Read the credits of the enrolled courses
            const courseCodes = enrollments.map((enrollment) => enrollment.course_code);
            const courses = await SELECT.from(Courses)
                .columns('credits')
                .where({ code: { in: courseCodes } });

            // Step 5: Calculate and return the average
            const totalCredits = courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);
            return Number((totalCredits / courses.length).toFixed(1));
        });


        //unbound actions to create and update a student

        this.on('createStudent', async (req) => {
            const { ID, name, email, department, status , bpNumber } = req.data;

            // Step 0: Check required fields
            if (!ID || !name || !email || !department || !status || !bpNumber) {
                return req.reject(400, 'Missing required fields: ID, name, email, department, status, bpNumber');
            }

            // Step 1: Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return req.reject(400, 'Invalid email format');
            }

            // Step 2: Check if student already exists
            const existingStudent = await SELECT.one.from(Students).where({ ID });
            if (existingStudent) {
                return req.reject(409, `Student with ID ${ID} already exists`);
            }

            // Step 3: Create new student
            await INSERT.into(Students).entries({ ID : ID, Name: name, Email: email, department: department, status: status, bpNumber: bpNumber });

            // Step 4: Return the newly created student
            return await SELECT.one.from(Students).where({ ID });
        });


        this.on('updateStudent', async (req) => {
            const { ID, name, email, department, status, bpNumber } = req.data;

            // Step 1: ID is required to find the student
            if (!ID) {
                return req.reject(400, 'Missing required field: ID');
            }

            // Step 2: Check student exists
            const student = await SELECT.one.from(Students).where({ ID });
            if (!student) {
                return req.reject(404, `Student with ID ${ID} not found`);
            }

            // Step 3: Validate email format when a new email is sent
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return req.reject(400, 'Invalid email format');
                }
            }

            // Step 4: Collect only the fields that were sent
            const changes = {};
            if (name !== undefined)       changes.Name       = name;
            if (email !== undefined)      changes.Email      = email;
            if (department !== undefined) changes.department = department;
            if (status !== undefined)     changes.status     = status;
            if (bpNumber !== undefined)   changes.bpNumber   = bpNumber;

            if (!Object.keys(changes).length) {
                return req.reject(400, 'No fields to update');
            }

            // Step 5: Update the student
            await UPDATE(Students).set(changes).where({ ID });

            // Step 6: Return the updated student
            return await SELECT.one.from(Students).where({ ID });
        });


        //unbound function: list all students of a department

        this.on('getStudentsByDepartment', async (req) => {

            // Step 1: Get department from request body
            const { department } = req.data;

            // Step 2: Validate input
            if (!department) {
                return req.reject(400, 'Missing required field: department');
            }

            // Step 3: Read the students of this department
            return await SELECT.from(Students)
                .where({ department })
                .orderBy('Name');
        });


        //unbound function: count all students

        this.on('getStudentCount', async () => {

            // Step 1: Read all student IDs
            const students = await SELECT.from(Students).columns('ID');

            // Step 2: Return the number of students
            return students.length;
        });


        return super.init();
    }
}
