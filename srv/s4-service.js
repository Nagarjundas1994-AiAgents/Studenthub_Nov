import cds from '@sap/cds';

const { SELECT } = cds.ql;
const S4_PARTNERS = 'API_BUSINESS_PARTNER.A_BusinessPartner';

export default class DavidS4Service extends cds.ApplicationService {
    async init() {
        // Step 1: Connect to the S/4 system
        const s4 = await cds.connect.to('API_BUSINESS_PARTNER');

        // Step 2: Handle GET requests on /DavidBusinessPartners
        this.on('READ', 'DavidBusinessPartners', async (req) => {
            // Step 2a: Copy the request query and point it to S/4
            const query = cds.ql.clone(req.query).from(S4_PARTNERS);

            // Step 2b: For GET .../DavidBusinessPartners('123'), the number is in the URL
            const { BusinessPartner } = req.params[0] || {};
            if (BusinessPartner) {
                query.where({ BusinessPartner });
            }

            // Step 2c: Run the query in S/4 and return the result
            return s4.run(query);
        });

        // Step 3: Handle the getBusinessPartnerDetails action
        this.on('getBusinessPartnerDetails', 'DavidBusinessPartners', async (req) => {
            // Step 3a: Get the business partner number from the request body
            const { BusinessPartner } = req.data;

            // Step 3b: Stop if the number was not sent
            if (!BusinessPartner) {
                return req.reject(400, 'Missing required field: BusinessPartner');
            }

            // Step 3c: Ask S/4 for this business partner
            const [businessPartner] = await s4.run(
                SELECT.from(S4_PARTNERS).where({ BusinessPartner })
            );

            // Step 3d: Stop if S/4 does not know this number
            if (!businessPartner) {
                return req.reject(404, `Business partner ${BusinessPartner} not found`);
            }

            // Step 3e: Return the business partner
            return businessPartner;
        });

        // Step 4: Finish the service setup
        return super.init();
    }
}
