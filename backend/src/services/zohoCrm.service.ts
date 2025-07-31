import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ZohoLead {
  id: string;
  Full_Name: string;
  Email: string;
  Mobile: string;
  [key: string]: any;
}

interface CreateLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  siteVisitDate: Date;
  alternateDate?: Date;
  requirements?: string;
  source: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

interface UpdateLeadData {
  firstName: string;
  lastName: string;
  email: string; // Added email to UpdateLeadData
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  siteVisitDate: Date;
  requirements?: string;
  source: string;
}

interface ZohoLeadData {
  Full_Name: string;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Mobile: string;
  Street: string;
  City: string;
  State: string;
  Zip_Code: string;
  Lead_Source: string;
  Description: string;
  Site_Visit_Date: string;
  Site_Visit_Scheduled: boolean;
  Lead_Status: string;
  Alternate_Site_Visit_Date?: string;
  UTM_Source?: string;
  UTM_Medium?: string;
  UTM_Campaign?: string;
}

class ZohoCrmService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.zohoapis.com/crm/v2',
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      config.headers.Authorization = `Zoho-oauthtoken ${this.accessToken}`;
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.accessToken = null;
          this.tokenExpiresAt = null;
          await this.ensureValidToken();
          
          // Retry the original request
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Zoho-oauthtoken ${this.accessToken}`;
          return this.client.request(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return; // Token is still valid
    }

    await this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
      const clientId = process.env.ZOHO_CLIENT_ID;
      const clientSecret = process.env.ZOHO_CLIENT_SECRET;

      if (!refreshToken || !clientId || !clientSecret) {
        throw new Error('Missing Zoho CRM credentials in environment variables');
      }

      const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token'
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData: ZohoTokenResponse = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000) - 60000); // 1 minute buffer

      logger.info('Zoho CRM access token refreshed successfully');
    } catch (error: any) {
      logger.error('Failed to refresh Zoho CRM access token', { error: error.message });
      throw new Error(`Zoho CRM token refresh failed: ${error.message}`);
    }
  }

  async searchLead(email: string, phone: string): Promise<ZohoLead | null> {
    try {
      const criteria = `((Email:equals:${email}) or (Mobile:equals:${phone}))`;
      
      const response = await this.client.get('/Leads/search', {
        params: {
          criteria,
          per_page: 1
        }
      });

      const leads = response.data?.data;
      return leads && leads.length > 0 ? leads[0] : null;
    } catch (error: any) {
      if (error.response?.status === 204) {
        // No records found
        return null;
      }
      logger.error('Zoho CRM lead search failed', { email, phone, error: error.message });
      throw error;
    }
  }

  async createLead(data: CreateLeadData): Promise<string> {
    try {
      const leadData: ZohoLeadData = {
        Full_Name: `${data.firstName} ${data.lastName}`,
        First_Name: data.firstName,
        Last_Name: data.lastName,
        Email: data.email,
        Mobile: data.phone,
        Street: data.address.street,
        City: data.address.city,
        State: data.address.state,
        Zip_Code: data.address.pincode,
        Lead_Source: data.source,
        Description: data.requirements || '',
        Site_Visit_Date: data.siteVisitDate.toISOString(),
        Site_Visit_Scheduled: true,
        Lead_Status: 'Site Visit Scheduled'
      };

      // Add alternate date if provided
      if (data.alternateDate) {
        leadData.Alternate_Site_Visit_Date = data.alternateDate.toISOString();
      }

      // Add UTM parameters if provided
      if (data.utmParams) {
        leadData.UTM_Source = data.utmParams.utm_source;
        leadData.UTM_Medium = data.utmParams.utm_medium;
        leadData.UTM_Campaign = data.utmParams.utm_campaign;
      }

      const response = await this.client.post('/Leads', {
        data: [leadData]
      });

      const result = response.data?.data?.[0];
      if (result?.status === 'success') {
        logger.info('Zoho CRM lead created successfully', { leadId: result.details.id });
        return result.details.id;
      } else {
        throw new Error(`Failed to create lead: ${result?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      logger.error('Zoho CRM lead creation failed', { data, error: error.message });
      throw error;
    }
  }

  async updateLead(leadId: string, data: UpdateLeadData): Promise<string> {
    try {
      const updateData: ZohoLeadData = {
        Full_Name: `${data.firstName} ${data.lastName}`,
        First_Name: data.firstName,
        Last_Name: data.lastName,
        Email: data.email, // Assuming email is part of UpdateLeadData or can be fetched
        Mobile: data.phone,
        Street: data.address.street,
        City: data.address.city,
        State: data.address.state,
        Zip_Code: data.address.pincode,
        Lead_Source: data.source,
        Description: data.requirements || '',
        Site_Visit_Date: data.siteVisitDate.toISOString(),
        Site_Visit_Scheduled: true,
        Lead_Status: 'Site Visit Scheduled'
      };

      const response = await this.client.put(`/Leads/${leadId}`, {
        data: [updateData]
      });

      const result = response.data?.data?.[0];
      if (result?.status === 'success') {
        logger.info('Zoho CRM lead updated successfully', { leadId });
        return leadId;
      } else {
        throw new Error(`Failed to update lead: ${result?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      logger.error('Zoho CRM lead update failed', { leadId, data, error: error.message });
      throw error;
    }
  }

  async addNoteToLead(leadId: string, note: string): Promise<void> {
    try {
      const noteData = {
        Note_Title: 'New Site Visit Scheduled',
        Note_Content: note,
        Parent_Id: leadId,
        se_module: 'Leads'
      };

      await this.client.post('/Notes', {
        data: [noteData]
      });

      logger.info('Note added to lead successfully', { leadId });
    } catch (error: any) {
      logger.error('Failed to add note to lead', { leadId, error: error.message });
      // Don't throw error as this is not critical
    }
  }
}

export const zohoCrmService = new ZohoCrmService();
