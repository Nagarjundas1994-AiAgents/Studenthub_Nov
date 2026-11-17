using {API_BUSINESS_PARTNER as externals4} from './external/API_BUSINESS_PARTNER';

service S4Service {

  entity BusinessPartners as projection on externals4.A_BusinessPartner
    actions {
      action getBusinessPartnerDetails(BusinessPartner: String) returns BusinessPartners;
    }
}