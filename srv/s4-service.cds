using {API_BUSINESS_PARTNER as externals4david} from './external/API_BUSINESS_PARTNER';

service DavidS4Service {

  entity DavidBusinessPartners as projection on externals4david.A_BusinessPartner
    actions {
      action getBusinessPartnerDetails(BusinessPartner: String) returns DavidBusinessPartners;
      action checkBusinessPartnerExists(BusinessPartner: String) returns Boolean;
      action getBusinessPartnerName(BusinessPartner: String) returns String;
    }



    // Unbound actions: not tied to a single partner, they work on the whole list
  action searchBusinessPartnersByName(name: String) returns array of DavidBusinessPartners;
  action getBusinessPartnersByCategory(category: String) returns array of DavidBusinessPartners;
  action getLatestBusinessPartners(count: Integer) returns array of DavidBusinessPartners;
  action getBusinessPartnerByUUID(BusinessPartnerUUID: UUID) returns DavidBusinessPartners;
}