import cds from '@sap/cds';

const { Students, Enrollments, Courses } = cds.entities('StudentService');


export default class StudentService extends cds.ApplicationService {
    async init() {

        // this.on('changeDepartment', 'Students', async (req) => {
        //     const { ID } = req.params[0];
        //     const { Department } = req.data;
        //     const student = await SELECT.one.from(Students).where({ ID });
        //     if (!student) {
        //       req.error(404, `Student with ID ${ID} not found`);
        //     }
        //     await this.run(UPDATE(Students).set({ department: Department }).where({ ID: ID }));
        //     return SELECT.one.from(Students).where({ ID });
        // }
        // );

        this.on('changeDepartment', 'Students', async (req) => {

            // Step 1: Get Student ID from URL
            const { ID } = req.params[0];

            // Step 2: Get Department from request body
            const { Department } = req.data;

            console.log("Student ID:", ID);
            console.log("New Department:", Department);

            // Step 3: Find student
            const student = await SELECT.one
                .from(Students)
                .where({ ID });

            // Step 4: Check student exists
            if (!student) {
                return req.reject(
                    404,
                    `Student with ID ${ID} not found`
                );
            }

            // Step 5: Update department
            await this.run(
                UPDATE(Students)
                    .set({ department: Department })
                    .where({ ID })
            );

            // Step 6: Fetch updated student
            const updatedStudent = await SELECT.one
                .from(Students)
                .where({ ID });

            // Step 7: Return response
            return updatedStudent;
        });


        return super.init();
    }
}
