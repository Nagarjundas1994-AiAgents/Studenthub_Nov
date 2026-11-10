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
            const student = await SELECT.from(Students).where({ ID }).limit(1);

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
            const student = await SELECT.from(Students).where({ ID }).limit(1);

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


        //unbound actions to create and update a student

        this.on('createStudent', async (req) => {
            const { ID, name, email, department, status , bpNumber } = req.data;

            //step: 0: Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return req.reject(400, 'Invalid email format');
            }
            if (!ID || !name || !email || !department || !status || !bpNumber) {

                return req.reject(400, 'Missing required fields: ID, name, email, department, status, bpNumber');

            }

            // Step 1: Check if student already exists
            const existingStudent = await SELECT.one.from(Students).where({ ID });
            if (existingStudent) {
                return req.reject(409, `Student with ID ${ID} already exists`);
            }

            // Step 2: Create new student
            const newStudent = await INSERT.into(Students).entries({ ID : ID, Name: name, Email: email, department: department, status: status, bpNumber: bpNumber });

            // Step 3: Return the newly created student
            return newStudent;
        });


        return super.init();
    }
}
