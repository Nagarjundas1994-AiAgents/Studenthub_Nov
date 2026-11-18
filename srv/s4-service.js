import cds from '@sap/cds';

const { SELECT } = cds.ql;
const S4_BUSINESS_PARTNERS = 'API_BUSINESS_PARTNER.A_BusinessPartner';

export default class DavidS4Service extends cds.ApplicationService {
    async init() {

        // DavidBusinessPartners has @cds.persistence.skip (it lives in S/4).
        // Generic handlers cannot serve it, so forward all reads to the
        // connected external service instead of querying the local database.

        const s4 = await cds.connect.to('API_BUSINESS_PARTNER');

        this.on('READ', 'DavidBusinessPartners', async (req) => {
            // Step 1: Check if the URL has a business partner number
            // Example: /DavidBusinessPartners('123')
            const { BusinessPartner } = req.params[0] || {};

            // Step 2: If there is a number, read that one from S/4
            if (BusinessPartner) {
                return s4.run(
                    SELECT.one.from(S4_BUSINESS_PARTNERS).where({ BusinessPartner })
                );
            }

            // Step 3: If there is no number, read the first 10 from S/4
            return s4.run(
                SELECT.from(S4_BUSINESS_PARTNERS).limit(10)
            );
        });

        // bound action: fetch one business partner from S/4
        this.on('getBusinessPartnerDetails', 'DavidBusinessPartners', async (req) => {

            // Step 1: Get the business partner number from the request
            const { BusinessPartner } = req.data;

            // Step 2: Validate input
            if (!BusinessPartner) {
                return req.reject(400, 'Missing required field: BusinessPartner');
            }

            // Step 3: Read the business partner from S/4
            const [businessPartner] = await s4.run(
                SELECT.from(S4_BUSINESS_PARTNERS)
                    .where({ BusinessPartner })
            );

            // Step 4: No match -> 404
            if (!businessPartner) {
                return req.reject(404, `Business partner ${BusinessPartner} not found`);
            }

            return businessPartner;
        });

        return super.init();
    }
}
