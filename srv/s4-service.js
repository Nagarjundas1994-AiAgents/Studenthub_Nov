import cds from '@sap/cds';

// SELECT lets us build database-style queries in JavaScript
const { SELECT } = cds.ql;

// Full name of the S/4 entity, used in every query below
const S4_BUSINESS_PARTNERS = 'API_BUSINESS_PARTNER.A_BusinessPartner';

export default class DavidS4Service extends cds.ApplicationService {
    async init() {

        // DavidBusinessPartners has @cds.persistence.skip (it lives in S/4).
        // Generic handlers cannot serve it, so forward all reads to the
        // connected external service instead of querying the local database.

        // Connect to the external S/4 service (configured in package.json under cds.requires)
        const s4 = await cds.connect.to('API_BUSINESS_PARTNER');

        // ------------------------------------------------------------------
        // READ: GET /DavidBusinessPartners, /DavidBusinessPartners('123'), $top, $filter ...
        // req.query already holds what the client asked for, so pass it to S/4
        // ------------------------------------------------------------------
        this.on('READ', 'DavidBusinessPartners', (req) => {
            return s4.run(req.query);
        });

        // ------------------------------------------------------------------
        // Bound action 1: get the full details of one business partner
        // ------------------------------------------------------------------
        this.on('getBusinessPartnerDetails', 'DavidBusinessPartners', async (req) => {

            // Step 1: Get the business partner number from the request
            const { BusinessPartner } = req.data;

            // Step 2: Validate input (400 = Bad Request)
            if (!BusinessPartner) {
                return req.reject(400, 'Missing required field: BusinessPartner');
            }

            // Step 3: Read the business partner from S/4
            const [businessPartner] = await s4.run(
                SELECT.from(S4_BUSINESS_PARTNERS).where({ BusinessPartner })
            );

            // Step 4: No match -> 404 (Not Found)
            if (!businessPartner) {
                return req.reject(404, `Business partner ${BusinessPartner} not found`);
            }

            return businessPartner;
        });

        // ------------------------------------------------------------------
        // Bound action 2: check if a business partner exists (returns true/false)
        // ------------------------------------------------------------------
        this.on('checkBusinessPartnerExists', 'DavidBusinessPartners', async (req) => {

            const { BusinessPartner } = req.data;

            if (!BusinessPartner) {
                return req.reject(400, 'Missing required field: BusinessPartner');
            }

            // Only read the key column, we just need to know if a row comes back
            const businessPartner = await s4.run(
                SELECT.one.from(S4_BUSINESS_PARTNERS)
                    .columns('BusinessPartner')
                    .where({ BusinessPartner })
            );

            // !! turns the result into true (found) or false (not found)
            return !!businessPartner;
        });

        // ------------------------------------------------------------------
        // Bound action 3: get only the full name of a business partner
        // ------------------------------------------------------------------
        this.on('getBusinessPartnerName', 'DavidBusinessPartners', async (req) => {

            const { BusinessPartner } = req.data;

            if (!BusinessPartner) {
                return req.reject(400, 'Missing required field: BusinessPartner');
            }

            // Only read the name column, so less data comes back from S/4
            const businessPartner = await s4.run(
                SELECT.one.from(S4_BUSINESS_PARTNERS)
                    .columns('BusinessPartnerFullName')
                    .where({ BusinessPartner })
            );

            if (!businessPartner) {
                return req.reject(404, `Business partner ${BusinessPartner} not found`);
            }

            return businessPartner.BusinessPartnerFullName;
        });

        // ------------------------------------------------------------------
        // Unbound action 4: search business partners by (part of) the name
        // ------------------------------------------------------------------
        this.on('searchBusinessPartnersByName', async (req) => {

            const { name } = req.data;

            if (!name) {
                return req.reject(400, 'Missing required field: name');
            }

            // like '%name%' finds the text anywhere in the name
            // (S/4 matching is case-sensitive). limit(20) keeps the result small.
            return s4.run(
                SELECT.from(S4_BUSINESS_PARTNERS)
                    .where({ BusinessPartnerFullName: { like: `%${name}%` } })
                    .limit(20)
            );
        });

        // ------------------------------------------------------------------
        // Unbound action 5: get business partners by category
        // '1' = Person, '2' = Organization
        // ------------------------------------------------------------------
        this.on('getBusinessPartnersByCategory', async (req) => {

            const { category } = req.data;

            if (!['1', '2'].includes(category)) {
                return req.reject(400, "category must be '1' (Person) or '2' (Organization)");
            }

            return s4.run(
                SELECT.from(S4_BUSINESS_PARTNERS)
                    .where({ BusinessPartnerCategory: category })
                    .limit(20)
            );
        });

        // ------------------------------------------------------------------
        // Unbound action 6: get the most recently created business partners
        // ------------------------------------------------------------------
        this.on('getLatestBusinessPartners', async (req) => {

            // Use 10 if the caller sends no count, and never allow more than 50
            const count = Math.min(req.data.count || 10, 50);

            return s4.run(
                SELECT.from(S4_BUSINESS_PARTNERS)
                    .orderBy({ CreationDate: 'desc' })
                    .limit(count)
            );
        });

        // ------------------------------------------------------------------
        // Unbound action 7: get one business partner by its UUID
        // (BusinessPartnerUUID is not the key, so we filter on it)
        // ------------------------------------------------------------------
        this.on('getBusinessPartnerByUUID', async (req) => {

            // Step 1: Get the UUID from the request
            const { BusinessPartnerUUID } = req.data;

            // Step 2: Validate input (400 = Bad Request)
            if (!BusinessPartnerUUID) {
                return req.reject(400, 'Missing required field: BusinessPartnerUUID');
            }

            // Step 3: Read the business partner from S/4 by UUID
            const businessPartner = await s4.run(
                SELECT.one.from(S4_BUSINESS_PARTNERS).where({ BusinessPartnerUUID })
            );

            // Step 4: No match -> 404 (Not Found)
            if (!businessPartner) {
                return req.reject(404, `Business partner with UUID ${BusinessPartnerUUID} not found`);
            }

            return businessPartner;
        });

        // Let CAP finish its normal setup (registers the handlers above)
        return super.init();
    }
}