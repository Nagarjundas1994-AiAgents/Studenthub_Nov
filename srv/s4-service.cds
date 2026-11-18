using {API_BUSINESS_PARTNER as externals4david} from './external/API_BUSINESS_PARTNER';

service DavidS4Service {

  entity DavidBusinessPartners as projection on externals4david.A_BusinessPartner
    actions {
      action getBusinessPartnerDetails(BusinessPartner: String) returns DavidBusinessPartners;
    }
}