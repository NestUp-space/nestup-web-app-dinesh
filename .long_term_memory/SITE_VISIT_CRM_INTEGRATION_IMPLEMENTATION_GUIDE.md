# Complete Implementation Guide: NestUp Site Visit Booking CRM Integration

## Overview

This guide provides step-by-step instructions to implement the site visit booking system with Zoho CRM and Google Calendar integration as per the Product Requirements Document.

## Implementation Timeline

- **Total Estimated Duration**: 8-10 weeks
- **Phases**: 7 phases with detailed tasks

---

## Phase 1: Frontend Data Structure Alignment

### Task 1.1: Update BookingFormSection.tsx Form Data Structure

**Duration**: 2-3 days  
**File**: `frontend/src/components/landing-page/BookingFormSection.tsx`

#### Step 1.1.1: Update FormData Interface and State

Replace the existing formData state with:

```typescript
const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: {
    street: "",
    city: "",
    state: "",
    pincode: ""
  },
  preferredDateTime: new Date(),
  alternateDateTime: null as Date | null,
  projectType: "",
  projectTimeline: "",
  requirements: "",
  source: "website",
  utmParams: {
    utm_source: "",
    utm_medium: "",
    utm_campaign: ""
  }
});
```

#### Step 1.1.2: Add New Event Handlers

Add these handlers after the existing ones:

```typescript
const handleAddressChange = (field: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    address: {
      ...prev.address,
      [field]: value
    }
  }));
};

const handleUtmChange = (field: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    utmParams: {
      ...prev.utmParams,
      [field]: value
    }
  }));
};

const handleAlternateDateChange = (date: Date | null) => {
  setFormData(prev => ({
    ...prev,
    alternateDateTime: date
  }));
};
```

#### Step 1.1.3: Add UTM Parameter Extraction

Add this useEffect after the existing localStorage useEffect:

```typescript
useEffect(() => {
  // Extract UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || ''
  };
  
  if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
    setFormData(prev => ({
      ...prev,
      utmParams
    }));
  }
}, []);
```

#### Step 1.1.4: Replace Form JSX

Replace the entire form JSX with:

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Name Fields */}
  <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">First Name *</label>
      <input 
        type="text" 
        name="firstName" 
        value={formData.firstName} 
        onChange={handleChange} 
        required 
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
      />
    </div>
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">Last Name *</label>
      <input 
        type="text" 
        name="lastName" 
        value={formData.lastName} 
        onChange={handleChange} 
        required 
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
      />
    </div>
  </div>

  {/* Contact Fields */}
  <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">Email *</label>
      <input 
        type="email" 
        name="email" 
        value={formData.email} 
        onChange={handleChange} 
        required 
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
      />
    </div>
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">Phone Number *</label>
      <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-orange">
        <span className="px-3 text-gray-500">+91</span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          maxLength={10}
          className="w-full px-4 py-2 border-l border-gray-300 focus:outline-none"
          pattern="\d{10}"
          title="Please enter a 10-digit phone number"
        />
      </div>
    </div>
  </div>

  {/* Address Fields */}
  <div className="form-group">
    <label className="block text-technical-gray text-sm font-medium mb-2">Street Address *</label>
    <input 
      type="text" 
      value={formData.address.street} 
      onChange={(e) => handleAddressChange('street', e.target.value)} 
      required 
      placeholder="House/Flat No., Street Name"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
    />
  </div>
  
  <div className="form-row grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">City *</label>
      <input 
        type="text" 
        value={formData.address.city} 
        onChange={(e) => handleAddressChange('city', e.target.value)} 
        required 
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
      />
    </div>
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">State *</label>
      <input 
        type="text" 
        value={formData.address.state} 
        onChange={(e) => handleAddressChange('state', e.target.value)} 
        required 
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
      />
    </div>
    <div className="form-group">
      <label className="block text-technical-gray text-sm font-medium mb-2">Pincode *</label>
      <input 
        type="text" 
        value={formData.address.pincode} 
        onChange={(e) => handleAddressChange('pincode', e.target.value)} 
        required 
        pattern="\d{6}"
        maxLength={6}
        title="Please enter a 6-digit pincode"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
      />
    </div>
  </div>

  {/* Project Details */}
  <div className="form-group">
    <label className="block text-technical-gray text-sm font-medium mb-2">Project Type</label>
    <select name="projectType" value={formData.projectType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white">
      <option value="">Select project type</option>
      <option>Kitchen Modular Units</option>
      <option>Bedroom Wardrobe & Storage</option>
      <option>Living Room Furniture</option>
      <option>Office Modular Setup</option>
      <option>Complete Home Interior</option>
      <option>Commercial Space</option>
    </select>
  </div>
  
  <div className="form-group">
    <label className="block text-technical-gray text-sm font-medium mb-2">Project Timeline</label>
    <select name="projectTimeline" value={formData.projectTimeline} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white">
      <option value="">When do you need this completed?</option>
      <option>Within 1 month</option>
      <option>1-3 months</option>
      <option>3-6 months</option>
      <option>Just exploring options</option>
    </select>
  </div>
  
  <div className="form-group">
    <label className="block text-technical-gray text-sm font-medium mb-2">Requirements</label>
    <textarea 
      name="requirements" 
      value={formData.requirements} 
      onChange={handleChange} 
      placeholder="Any specific requirements, measurements you have, or questions about the process?" 
      rows={3} 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
    ></textarea>
  </div>
  
  <button type="submit" className="cta-button w-full bg-primary-orange text-white py-3 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors flex flex-col items-center justify-center" disabled={isSubmitting}>
    {isSubmitting ? 'Booking...' : 'Book Free Site Visit'}
    <span className="button-subtitle text-sm opacity-80 mt-1">Confirmed instantly</span>
  </button>
</form>
```

### Task 1.2: Enhanced Frontend Validation

**Duration**: 1 day

#### Step 1.2.1: Add Validation Functions

Add these validation functions before the component:

```typescript
const validateIndianPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers start with 6-9
  return phoneRegex.test(phone);
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

const validateBusinessHours = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 8 && hours <= 18; // 8 AM to 6 PM
};

const validateFutureDate = (date: Date): boolean => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day
  return date > tomorrow;
};
```

#### Step 1.2.2: Update Validation Function

Replace the existing `validateContactDetails` with:

```typescript
const validateContactDetails = (): string[] => {
  const errors: string[] = [];
  
  if (!formData.firstName.trim()) {
    errors.push("First name is required");
  }
  
  if (!formData.lastName.trim()) {
    errors.push("Last name is required");
  }
  
  if (!validateEmail(formData.email)) {
    errors.push("Please provide a valid email address");
  }
  
  if (!validateIndianPhoneNumber(formData.phone)) {
    errors.push("Please provide a valid 10-digit Indian mobile number starting with 6-9");
  }
  
  if (!formData.address.street.trim()) {
    errors.push("Street address is required");
  }
  
  if (!formData.address.city.trim()) {
    errors.push("City is required");
  }
  
  if (!formData.address.state.trim()) {
    errors.push("State is required");
  }
  
  if (!validatePincode(formData.address.pincode)) {
    errors.push("Please provide a valid 6-digit pincode");
  }
  
  if (!validateFutureDate(formData.preferredDateTime)) {
    errors.push("Preferred date must be at least 24 hours in the future");
  }
  
  if (!validateBusinessHours(formData.preferredDateTime)) {
    errors.push("Preferred time must be between 8:00 AM and 6:00 PM");
  }
  
  return errors;
};
```

### Task 1.3: Update API Call Structure

**Duration**: 1 day

#### Step 1.3.1: Add Response Interface

Add this interface at the top of the file:

```typescript
interface BookingResponse {
  success: boolean;
  bookingId?: string;
  crmLeadId?: string;
  calendarEventId?: string;
  message?: string;
  error?: string;
  details?: string;
}
```

#### Step 1.3.2: Update Submit Handler

Replace the existing `handleSubmit` function:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate form
  const validationErrors = validateContactDetails();
  if (validationErrors.length > 0) {
    setErrorMessage(validationErrors.join(", "));
    setSubmitStatus('error');
    return;
  }
  
  setIsSubmitting(true);
  setSubmitStatus('idle');
  setErrorMessage("");

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site-visit/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        preferredDateTime: formData.preferredDateTime.toISOString(),
        alternateDateTime: formData.alternateDateTime?.toISOString() || null,
        requirements: formData.requirements,
        source: formData.source,
        utmParams: formData.utmParams
      }),
    });

    const data: BookingResponse = await response.json();

    if (response.ok) {
      setSubmitStatus('success');
      const bookingDetails = {
        bookingId: data.bookingId,
        crmLeadId: data.crmLeadId,
        calendarEventId: data.calendarEventId,
        customerName: `${formData.firstName} ${formData.lastName}`,
        appointmentDate: formData.preferredDateTime.toLocaleDateString()
      };
      
      onSubmit(bookingDetails);
      localStorage.removeItem("formData");
    } else {
      setSubmitStatus('error');
      setErrorMessage(data.error || data.message || "An error occurred while booking the site visit.");
    }
  } catch (error) {
    setSubmitStatus('error');
    setErrorMessage("An error occurred while booking the site visit. Please try again later.");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Phase 2: Backend Infrastructure Setup

### Task 2.1: Create Booking Prisma Model

**Duration**: 1-2 days  
**File**: `backend/prisma/schema.prisma`

#### Step 2.1.1: Add Booking Model

Add this to your `schema.prisma` file:

```prisma
model Booking {
  id                  String        @id @default(cuid())
  firstName           String
  lastName            String
  email               String
  phone               String
  address             Json          // {street, city, state, pincode}
  preferredDateTime   DateTime
  alternateDateTime   DateTime?
  projectType         String?
  requirements        String?
  source              String        @default("website")
  utmParams           Json?         // {utm_source, utm_medium, utm_campaign}
  crmLeadId           String?
  calendarEventId     String?
  status              BookingStatus @default(PENDING)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([email])
  @@index([phone])
  @@index([preferredDateTime])
  @@index([status])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CRM_SYNCED
  CALENDAR_CREATED
  COMPLETED
  CANCELLED
  FAILED
}
```

#### Step 2.1.2: Run Migration

Execute these commands:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### Task 2.2: Create Booking Repository

**Duration**: 2-3 days  
**File**: `backend/src/repositories/booking.repository.ts`

Create this new file:

```typescript
import { PrismaClient, Booking, BookingStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class BookingRepository {
  async create(data: Prisma.BookingCreateInput): Promise<Booking> {
    return await prisma.booking.create({
      data
    });
  }

  async findById(id: string): Promise<Booking | null> {
    return await prisma.booking.findUnique({
      where: { id }
    });
  }

  async findByEmailAndPhone(email: string, phone: string): Promise<Booking | null> {
    return await prisma.booking.findFirst({
      where: {
        AND: [
          { email: email.toLowerCase() },
          { phone }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByEmailAndDate(email: string, date: Date): Promise<Booking | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.booking.findFirst({
      where: {
        email: email.toLowerCase(),
        preferredDateTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: BookingStatus.CANCELLED
        }
      }
    });
  }

  async findRecentByEmailAndPhone(email: string, phone: string, days: number): Promise<Booking | null> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await prisma.booking.findFirst({
      where: {
        AND: [
          { email: email.toLowerCase() },
          { phone },
          { createdAt: { gte: cutoffDate } },
          { status: { not: BookingStatus.CANCELLED } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateCrmDetails(id: string, crmLeadId: string): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: { 
        crmLeadId,
        status: BookingStatus.CRM_SYNCED,
        updatedAt: new Date()
      }
    });
  }

  async updateCalendarDetails(id: string, calendarEventId: string): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: { 
        calendarEventId,
        updatedAt: new Date()
      }
    });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
  }

  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findPendingBookings(): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.PENDING, BookingStatus.FAILED]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const bookingRepository = new BookingRepository();
```

### Task 2.3: Create DTOs and Validation Schemas

**Duration**: 1 day

#### Step 2.3.1: Create DTO File

**File**: `backend/src/dtos/siteVisitBooking.dto.ts`

```typescript
export interface CreateBookingDto {
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
  preferredDateTime: string; // ISO string
  alternateDateTime?: string; // ISO string
  requirements?: string;
  source?: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

export interface BookingResponseDto {
  success: boolean;
  bookingId?: string;
  crmLeadId?: string;
  calendarEventId?: string;
  message?: string;
  error?: string;
  details?: string;
}

export interface CrmLeadDto {
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
  utmParams?: any;
}

export interface CalendarEventDto {
  summary: string;
  description: string;
  location: string;
  startTime: Date;
  duration: number; // in minutes
  attendeeEmail: string;
}
```

#### Step 2.3.2: Create Validation Schema

**File**: `backend/src/validations/siteVisitBooking.validation.ts`

```typescript
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, { message: 'Street address is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  pincode: z.string().regex(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
});

const utmParamsSchema = z.object({
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
}).optional();

export const createBookingSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email({ message: 'Invalid email format' }),
    phone: z.string()
      .regex(/^[6-9]\d{9}$/, { message: 'Invalid Indian phone number format' }),
    address: addressSchema,
    preferredDateTime: z.string()
      .datetime({ message: 'Invalid preferred date time format' }),
    alternateDateTime: z.string()
      .datetime({ message: 'Invalid alternate date time format' })
      .optional(),
    requirements: z.string().optional(),
    source: z.string().default('website'),
    utmParams: utmParamsSchema
  })
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
```

---

## Phase 3: External API Integrations

### Task 3.1: Zoho CRM Integration Service

**Duration**: 1-2 weeks  
**File**: `backend/src/services/zohoCrm.service.ts`

#### Step 3.1.1: Install Required Dependencies

```bash
cd backend
npm install axios node-cron
npm install @types/node-cron --save-dev
```

#### Step 3.1.2: Create Zoho CRM Service

```typescript
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
  utmParams?: any;
}

interface UpdateLeadData {
  firstName: string;
  lastName: string;
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
      const leadData = {
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
      const updateData = {
        Full_Name: `${data.firstName} ${data.lastName}`,
        First_Name: data.firstName,
        Last_Name: data.lastName,
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
```

### Task 3.2: Google Calendar Integration Service

**Duration**: 1-2 weeks  
**File**: `backend/src/services/googleCalendar.service.ts`

#### Step 3.2.1: Install Google APIs Client

```bash
cd backend
npm install googleapis
npm install @types/googleapis --save-dev
```

#### Step 3.2.2: Create Google Calendar Service

```typescript
import { google, calendar_v3 } from 'googleapis';
import { logger } from '../config/logger';

interface CreateEventData {
  summary: string;
  description: string;
  location: string;
  startTime: Date;
  duration: number; // in minutes
  attendeeEmail: string;
}

class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;

  constructor() {
    // Service Account authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async createEvent(data: CreateEventData): Promise<string> {
    try {
      const endTime = new Date(data.startTime.getTime() + data.duration * 60000);

      const event: calendar_v3.Schema$Event = {
        summary: data.summary,
        description: data.description,
        location: data.location,
        start: {
          dateTime: data.startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        attendees: [
          { email: data.attendeeEmail },
          { email: process.env.GOOGLE_CALENDAR_DEFAULT_ATTENDEE || 'admin@nestup.space' }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'email', minutes: 2 * 60 },  // 2 hours
            { method: 'popup', minutes: 30 },      // 30 minutes
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false,
      };

      const response = await this.calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email invitations
      });

      if (response.data.id) {
        logger.info('Google Calendar event created successfully', { 
          eventId: response.data.id,
          summary: data.summary 
        });
        return response.data.id;
      } else {
        throw new Error('Failed to create calendar event: No event ID returned');
      }
    } catch (error: any) {
      logger.error('Google Calendar event creation failed', { 
        data, 
        error: error.message 
      });
      throw error;
    }
  }

  async updateEvent(eventId: string, data: Partial<CreateEventData>): Promise<void> {
    try {
      const updateData: calendar_v3.Schema$Event = {};

      if (data.summary) updateData.summary = data.summary;
      if (data.description) updateData.description = data.description;
      if (data.location) updateData.location = data.location;
      
      if (data.startTime && data.duration) {
        const endTime = new Date(data.startTime.getTime() + data.duration * 60000);
        updateData.start = {
          dateTime: data.startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        };
        updateData.end = {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        };
      }

      await this.calendar.events.update({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId,
        requestBody: updateData,
        sendUpdates: 'all',
      });

      logger.info('Google Calendar event updated successfully', { eventId });
    } catch (error: any) {
      logger.error('Google Calendar event update failed', { 
        eventId, 
        data, 
        error: error.message 
      });
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId,
        sendUpdates: 'all',
      });

      logger.info('Google Calendar event deleted successfully', { eventId });
    } catch (error: any) {
      logger.error('Google Calendar event deletion failed', { 
        eventId, 
        error: error.message 
      });
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      logger.error('Google Calendar event retrieval failed', { 
        eventId, 
        error: error.message 
      });
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
```

### Task 3.3: Environment Variables Setup

**Duration**: 1 day  
**File**: `backend/.env`

#### Step 3.3.1: Add Environment Variables

Add these variables to your `.env` file:

```env
# Zoho CRM Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

# Google Calendar Configuration
GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_CALENDAR_DEFAULT_ATTENDEE=admin@nestup.space
```

#### Step 3.3.2: Update Environment Configuration

**File**: `backend/src/config/env.ts`

Add these environment variables to your existing configuration:

```typescript
// Add these to your existing env configuration
ZOHO_CLIENT_ID: z.string().min(1),
ZOHO_CLIENT_SECRET: z.string().min(1),
ZOHO_REFRESH_TOKEN: z.string().min(1),
GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL: z.string().email(),
GOOGLE_CALENDAR_PRIVATE_KEY: z.string().min(1),
GOOGLE_CALENDAR_ID: z.string().min(1),
GOOGLE_CALENDAR_DEFAULT_ATTENDEE: z.string().email().optional(),
```

---

## Phase 4: Main Booking Service Implementation

### Task 4.1: Create Site Visit Booking Service

**Duration**: 1 week  
**File**: `backend/src/services/siteVisitBooking.service.ts`

#### Step 4.1.1: Complete Service Implementation

```typescript
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { bookingRepository } from '../repositories/booking.repository';
import { zohoCrmService } from './zohoCrm.service';
import { googleCalendarService } from './googleCalendar.service';
import { BadRequestError, InternalServerError } from '../common/errors/customErrors';
import { logger } from '../config/logger';

export interface CreateBookingInput {
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
  preferredDateTime: Date;
  alternateDateTime?: Date;
  requirements?: string;
  source?: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

export interface BookingResult {
  booking: Booking;
  crmLeadId?: string;
  calendarEventId?: string;
  errors: string[];
}

class SiteVisitBookingService {
  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    const errors: string[] = [];
    
    try {
      // Step 1: Validate input
      this.validateBookingInput(input);
      
      // Step 2: Check for duplicate bookings
      await this.checkDuplicateBooking(input.email, input.phone, input.preferredDateTime);
      
      // Step 3: Create booking record
      const booking = await this.createBookingRecord(input);
      
      // Step 4: Async CRM and Calendar integration
      let crmLeadId: string | undefined;
      let calendarEventId: string | undefined;
      
      try {
        // CRM Integration
        crmLeadId = await this.integrateCRM(booking);
        if (crmLeadId) {
          await bookingRepository.updateCrmDetails(booking.id, crmLeadId);
        }
      } catch (error: any) {
        logger.error('CRM integration failed', { bookingId: booking.id, error: error.message });
        errors.push('CRM integration failed');
      }
      
      try {
        // Calendar Integration
        calendarEventId = await this.integrateCalendar(booking);
        if (calendarEventId) {
          await bookingRepository.updateCalendarDetails(booking.id, calendarEventId);
        }
      } catch (error: any) {
        logger.error('Calendar integration failed', { bookingId: booking.id, error: error.message });
        errors.push('Calendar integration failed');
      }
      
      // Step 5: Update booking status
      const finalStatus = this.determineFinalStatus(crmLeadId, calendarEventId);
      await bookingRepository.updateStatus(booking.id, finalStatus);
      
      // Step 6: Send notification email (fallback if integrations fail)
      if (errors.length > 0) {
        await this.sendFallbackNotification(booking);
      }
      
      return {
        booking: {
          ...booking,
          status: finalStatus,
          crmLeadId,
          calendarEventId
        },
        crmLeadId,
        calendarEventId,
        errors
      };
      
    } catch (error: any) {
      logger.error('Booking creation failed', { input, error: error.message });
      throw error;
    }
  }
  
  private validateBookingInput(input: CreateBookingInput): void {
    // Validate required fields
    if (!input.firstName?.trim()) throw new BadRequestError('First name is required');
    if (!input.lastName?.trim()) throw new BadRequestError('Last name is required');
    if (!input.email?.trim()) throw new BadRequestError('Email is required');
    if (!input.phone?.trim()) throw new BadRequestError('Phone is required');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new BadRequestError('Invalid email format');
    }
    
    // Validate Indian phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(input.phone)) {
      throw new BadRequestError('Invalid Indian phone number format');
    }
    
    // Validate address
    if (!input.address?.street?.trim()) throw new BadRequestError('Street address is required');
    if (!input.address?.city?.trim()) throw new BadRequestError('City is required');
    if (!input.address?.state?.trim()) throw new BadRequestError('State is required');
    if (!input.address?.pincode?.trim()) throw new BadRequestError('Pincode is required');
    
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(input.address.pincode)) {
      throw new BadRequestError('Invalid pincode format');
    }
    
    // Validate preferred date (future date, business hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (input.preferredDateTime <= tomorrow) {
      throw new BadRequestError('Preferred date must be at least 24 hours in the future');
    }
    
    const hours = input.preferredDateTime.getHours();
    if (hours < 8 || hours > 18) {
      throw new BadRequestError('Preferred time must be between 8:00 AM and 6:00 PM');
    }
  }
  
  private async checkDuplicateBooking(email: string, phone: string, preferredDateTime: Date): Promise<void> {
    // Check for duplicate booking on same day
    const sameDay = await bookingRepository.findByEmailAndDate(email, preferredDateTime);
    if (sameDay) {
      throw new BadRequestError('You already have a booking on this date');
    }
    
    // Check for recent booking (within 7 days)
    const recentBooking = await bookingRepository.findRecentByEmailAndPhone(email, phone, 7);
    if (recentBooking) {
      throw new BadRequestError('You have a recent booking. Please contact support for additional bookings');
    }
  }
  
  private async createBookingRecord(input: CreateBookingInput): Promise<Booking> {
    const bookingData: Prisma.BookingCreateInput = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      address: input.address,
      preferredDateTime: input.preferredDateTime,
      alternateDateTime: input.alternateDateTime,
      requirements: input.requirements?.trim(),
      source: input.source || 'website',
      utmParams: input.utmParams || {},
      status: BookingStatus.PENDING
    };
    
    return await bookingRepository.create(bookingData);
  }
  
  private async integrateCRM(booking: Booking): Promise<string | undefined> {
    try {
      // Check if lead already exists
      const existingLead = await zohoCrmService.searchLead(booking.email, booking.phone);
      
      if (existingLead) {
        // Update existing lead
        const leadId = await zohoCrmService.updateLead(existingLead.id, {
          firstName: booking.firstName,
          lastName: booking.lastName,
          phone: booking.phone,
          address: booking.address as any,
          siteVisitDate: booking.preferredDateTime,
          requirements: booking.requirements,
          source: booking.source
        });
        
        logger.info('CRM lead updated', { bookingId: booking.id, leadId });
        return leadId;
      } else {
        // Create new lead
        const leadId = await zohoCrmService.createLead({
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          address: booking.address as any,
          siteVisitDate: booking.preferredDateTime,
          alternateDate: booking.alternateDateTime,
          requirements: booking.requirements,
          source: booking.source,
          utmParams: booking.utmParams
        });
        
        logger.info('CRM lead created', { bookingId: booking.id, leadId });
        return leadId;
      }
    } catch (error: any) {
      logger.error('CRM integration error', { bookingId: booking.id, error: error.message });
      throw error;
    }
  }
  
  private async integrateCalendar(booking: Booking): Promise<string | undefined> {
    try {
      const eventId = await googleCalendarService.createEvent({
        summary: `Site Visit - ${booking.firstName} ${booking.lastName}`,
        description: this.generateEventDescription(booking),
        location: this.formatAddress(booking.address as any),
        startTime: booking.preferredDateTime,
        duration: 90, // 90 minutes
        attendeeEmail: booking.email
      });
      
      logger.info('Calendar event created', { bookingId: booking.id, eventId });
      return eventId;
    } catch (error: any) {
      logger.error('Calendar integration error', { bookingId: booking.id, error: error.message });
      throw error;
    }
  }
  
  private generateEventDescription(booking: Booking): string {
    const address = booking.address as any;
    return `
Site Visit Details:
Customer: ${booking.firstName} ${booking.lastName}
Phone: ${booking.phone}
Email: ${booking.email}
Address: ${address.street}, ${address.city}, ${address.state} ${address.pincode}
Requirements: ${booking.requirements || 'None specified'}
Booking ID: ${booking.id}
Source: ${booking.source}
    `.trim();
  }
  
  private formatAddress(address: { street: string; city: string; state: string; pincode: string }): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
  }
  
  private determineFinalStatus(crmLeadId?: string, calendarEventId?: string): BookingStatus {
    if (crmLeadId && calendarEventId) {
      return BookingStatus.CONFIRMED;
    } else if (crmLeadId || calendarEventId) {
      return BookingStatus.CRM_SYNCED; // Partially integrated
    } else {
      return BookingStatus.FAILED;
    }
  }
  
  private async sendFallbackNotification(booking: Booking): Promise<void> {
    // Implementation for fallback email notification
    logger.warn('Fallback notification needed', { bookingId: booking.id });
    
    // TODO: Implement email notification service
    // await emailService.sendBookingNotification(booking);
  }
}

export const siteVisitBookingService = new SiteVisitBookingService();
```

---

## Phase 5: Controller and Route Implementation

### Task 5.1: Create Site Visit Booking Controller

**Duration**: 2-3 days  
**File**: `backend/src/controllers/siteVisitBooking.controller.ts`

#### Step 5.1.1: Complete Controller Implementation

```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { siteVisitBookingService, CreateBookingInput } from '../services/siteVisitBooking.service';
import { BadRequestError, InternalServerError } from '../common/errors/customErrors';
import { logger } from '../config/logger';

export interface BookSiteVisitBookingRequest extends Request {
  body: {
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
    preferredDateTime: string; // ISO string
    alternateDateTime?: string; // ISO string
    requirements?: string;
    source?: string;
    utmParams?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    };
  };
}

export const bookSiteVisitBooking = async (
  req: BookSiteVisitBookingRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Site visit booking request received', { 
      email: req.body.email,
      phone: req.body.phone,
      source: req.body.source 
    });

    // Parse dates
    const preferredDateTime = new Date(req.body.preferredDateTime);
    const alternateDateTime = req.body.alternateDateTime ? new Date(req.body.alternateDateTime) : undefined;

    // Validate date parsing
    if (isNaN(preferredDateTime.getTime())) {
      throw new BadRequestError('Invalid preferred date time format');
    }

    if (alternateDateTime && isNaN(alternateDateTime.getTime())) {
      throw new BadRequestError('Invalid alternate date time format');
    }

    const input: CreateBookingInput = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      preferredDateTime,
      alternateDateTime,
      requirements: req.body.requirements,
      source: req.body.source,
      utmParams: req.body.utmParams
    };

    // Create booking
    const result = await siteVisitBookingService.createBooking(input);

    // Prepare response
    const response = {
      success: true,
      bookingId: result.booking.id,
      crmLeadId: result.crmLeadId,
      calendarEventId: result.calendarEventId,
      message: 'Site visit booked successfully'
    };

    // Add warnings if there were integration errors
    if (result.errors.length > 0) {
      response.message += ` (Note: ${result.errors.join(', ')})`;
    }

    logger.info('Site visit booking completed', {
      bookingId: result.booking.id,
      crmLeadId: result.crmLeadId,
      calendarEventId: result.calendarEventId,
      errors: result.errors
    });

    res.status(StatusCodes.CREATED).json(response);

  } catch (error: unknown) {
    logger.error('Site visit booking failed', { 
      body: req.body, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    if (error instanceof BadRequestError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to book site visit',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
    
    next(error);
  }
};

// Additional controller methods for admin functionality
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingRepository.findById(id);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      booking
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;
    
    let bookings;
    if (status) {
      bookings = await bookingRepository.findByStatus(status as BookingStatus);
    } else {
      bookings = await bookingRepository.findPendingBookings();
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      bookings,
      count: bookings.length
    });
  } catch (error: unknown) {
    next(error);
  }
};
```

### Task 5.2: Create Route File

**Duration**: 1 day  
**File**: `backend/src/routes/siteVisitBooking.routes.ts`

#### Step 5.2.1: Create Route Implementation

```typescript
import express from 'express';
import { bookSiteVisitBooking, getBookingById, getAllBookings } from '../controllers/siteVisitBooking.controller';
import { validateRequest } from '../common/middleware/validateRequest';
import { createBookingSchema } from '../validations/siteVisitBooking.validation';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

// Public route for booking
router.post('/book', validateRequest(createBookingSchema), bookSiteVisitBooking);

// Admin routes (require authentication)
router.get('/bookings', auth, getAllBookings);
router.get('/bookings/:id', auth, getBookingById);

export default router;
```

### Task 5.3: Update Server.ts

**Duration**: 1 day  
**File**: `backend/src/server.ts`

#### Step 5.3.1: Add New Route Import and Mount

Add these imports at the top with other route imports:

```typescript
import siteVisitBookingRouter from "@/routes/siteVisitBooking.routes";
```

Add this route mounting with other routes:

```typescript
// Site visit booking routes
app.use("/api/site-visit", siteVisitBookingRouter);
```

Make sure the existing site-visit routes are also mounted (if they exist):

```typescript
// Existing site visit routes (if needed)
import siteVisitRouter from "@/routes/site-visit.routes";
app.use("/api/site-visits", siteVisitRouter);
```

---

## Phase 6: Error Handling and Resilience

### Task 6.1: Enhanced Error Handling

**Duration**: 2-3 days

#### Step 6.1.1: Create Custom Error Classes

**File**: `backend/src/common/errors/crmErrors.ts`

```typescript
export class CrmIntegrationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'CrmIntegrationError';
  }
}

export class CalendarIntegrationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'CalendarIntegrationError';
  }
}

export class BookingValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'BookingValidationError';
  }
}
```

#### Step 6.1.2: Create Retry Utility

**File**: `backend/src/utils/retry.ts`

```typescript
export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  operationName: string = 'operation'
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );

      console.log(`${operationName} failed on attempt ${attempt}/${config.maxAttempts}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

#### Step 6.1.3: Create Circuit Breaker Utility

**File**: `backend/src/utils/circuitBreaker.ts`

```typescript
export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;

  constructor(
    private options: CircuitBreakerOptions,
    private name: string = 'CircuitBreaker'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`${this.name}: Circuit breaker is OPEN`);
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.recoveryTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
```

### Task 6.2: Queue System for Async Processing

**Duration**: 1 week

#### Step 6.2.1: Install Queue Dependencies

```bash
cd backend
npm install bull redis
npm install @types/bull --save-dev
```

#### Step 6.2.2: Create Queue Service

**File**: `backend/src/services/queue.service.ts`

```typescript
import Bull from 'bull';
import { logger } from '../config/logger';

export interface BookingProcessingJob {
  bookingId: string;
  operation: 'crm_integration' | 'calendar_integration' | 'retry_failed';
  data: any;
}

class QueueService {
  private bookingQueue: Bull.Queue<BookingProcessingJob>;

  constructor() {
    this.bookingQueue = new Bull<BookingProcessingJob>('booking-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    });

    this.setupProcessors();
    this.setupEventHandlers();
  }

  private setupProcessors(): void {
    this.bookingQueue.process('crm_integration', 5, async (job) => {
      const { bookingId, data } = job.data;
      logger.info('Processing CRM integration job', { bookingId });
      
      // Import here to avoid circular dependencies
      const { siteVisitBookingService } = await import('./siteVisitBooking.service');
      const { bookingRepository } = await import('../repositories/booking.repository');
      
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }
      
      // Retry CRM integration
      const crmLeadId = await siteVisitBookingService['integrateCRM'](booking);
      if (crmLeadId) {
        await bookingRepository.updateCrmDetails(bookingId, crmLeadId);
      }
      
      return { success: true, crmLeadId };
    });

    this.bookingQueue.process('calendar_integration', 5, async (job) => {
      const { bookingId, data } = job.data;
      logger.info('Processing Calendar integration job', { bookingId });
      
      const { siteVisitBookingService } = await import('./siteVisitBooking.service');
      const { bookingRepository } = await import('../repositories/booking.repository');
      
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }
      
      // Retry Calendar integration
      const calendarEventId = await siteVisitBookingService['integrateCalendar'](booking);
      if (calendarEventId) {
        await bookingRepository.updateCalendarDetails(bookingId, calendarEventId);
      }
      
      return { success: true, calendarEventId };
    });
  }

  private setupEventHandlers(): void {
    this.bookingQueue.on('completed', (job, result) => {
      logger.info('Job completed', { 
        jobId: job.id, 
        type: job.data.operation,
        bookingId: job.data.bookingId,
        result 
      });
    });

    this.bookingQueue.on('failed', (job, err) => {
      logger.error('Job failed', { 
        jobId: job.id, 
        type: job.data.operation,
        bookingId: job.data.bookingId,
        error: err.message 
      });
    });

    this.bookingQueue.on('stalled', (job) => {
      logger.warn('Job stalled', { 
        jobId: job.id, 
        type: job.data.operation,
        bookingId: job.data.bookingId 
      });
    });
  }

  async addCrmIntegrationJob(bookingId: string, data: any): Promise<Bull.Job<BookingProcessingJob>> {
    return this.bookingQueue.add('crm_integration', {
      bookingId,
      operation: 'crm_integration',
      data
    }, {
      delay: 5000, // 5 second delay
      priority: 1
    });
  }

  async addCalendarIntegrationJob(bookingId: string, data: any): Promise<Bull.Job<BookingProcessingJob>> {
    return this.bookingQueue.add('calendar_integration', {
      bookingId,
      operation: 'calendar_integration',
      data
    }, {
      delay: 3000, // 3 second delay
      priority: 2
    });
  }

  async getQueueStats(): Promise<any> {
    const waiting = await this.bookingQueue.getWaiting();
    const active = await this.bookingQueue.getActive();
    const completed = await this.bookingQueue.getCompleted();
    const failed = await this.bookingQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }
}

export const queueService = new QueueService();
```

---

## Phase 7: Testing and Deployment

### Task 7.1: Unit Tests

**Duration**: 1 week

#### Step 7.1.1: Install Testing Dependencies

```bash
cd backend
npm install jest @types/jest supertest @types/supertest ts-jest --save-dev
```

#### Step 7.1.2: Create Jest Configuration

**File**: `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/config/**',
    '!src/scripts/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

#### Step 7.1.3: Create Test Setup

**File**: `backend/src/__tests__/setup.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.booking.deleteMany();
});

afterEach(async () => {
  // Clean up test data after each test
  await prisma.booking.deleteMany();
});
```

#### Step 7.1.4: Create Service Tests

**File**: `backend/src/__tests__/services/siteVisitBooking.service.test.ts`

```typescript
import { siteVisitBookingService } from '../../services/siteVisitBooking.service';
import { bookingRepository } from '../../repositories/booking.repository';
import { zohoCrmService } from '../../services/zohoCrm.service';
import { googleCalendarService } from '../../services/googleCalendar.service';
import { BadRequestError } from '../../common/errors/customErrors';

// Mock external services
jest.mock('../../services/zohoCrm.service');
jest.mock('../../services/googleCalendar.service');
jest.mock('../../repositories/booking.repository');

describe('SiteVisitBookingService', () => {
  const validBookingInput = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    preferredDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    requirements: 'Kitchen renovation',
    source: 'website'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create booking successfully with CRM and Calendar integration', async () => {
      // Arrange
      const mockBooking = { id: 'booking-123', ...validBookingInput };
      const mockCrmLeadId = 'crm-lead-456';
      const mockCalendarEventId = 'calendar-event-789';

      (bookingRepository.findByEmailAndDate as jest.Mock).mockResolvedValue(null);
      (bookingRepository.findRecentByEmailAndPhone as jest.Mock).mockResolvedValue(null);
      (bookingRepository.create as jest.Mock).mockResolvedValue(mockBooking);
      (zohoCrmService.searchLead as jest.Mock).mockResolvedValue(null);
      (zohoCrmService.createLead as jest.Mock).mockResolvedValue(mockCrmLeadId);
      (googleCalendarService.createEvent as jest.Mock).mockResolvedValue(mockCalendarEventId);
      (bookingRepository.updateCrmDetails as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateCalendarDetails as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue(mockBooking);

      // Act
      const result = await siteVisitBookingService.createBooking(validBookingInput);

      // Assert
      expect(result.booking.id).toBe('booking-123');
      expect(result.crmLeadId).toBe(mockCrmLeadId);
      expect(result.calendarEventId).toBe(mockCalendarEventId);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw BadRequestError for invalid email', async () => {
      // Arrange
      const invalidInput = {
        ...validBookingInput,
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(siteVisitBookingService.createBooking(invalidInput))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw BadRequestError for invalid phone number', async () => {
      // Arrange
      const invalidInput = {
        ...validBookingInput,
        phone: '123456' // Invalid Indian phone number
      };

      // Act & Assert
      await expect(siteVisitBookingService.createBooking(invalidInput))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw BadRequestError for past date', async () => {
      // Arrange
      const invalidInput = {
        ...validBookingInput,
        preferredDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      // Act & Assert
      await expect(siteVisitBookingService.createBooking(invalidInput))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should handle CRM integration failure gracefully', async () => {
      // Arrange
      const mockBooking = { id: 'booking-123', ...validBookingInput };
      const mockCalendarEventId = 'calendar-event-789';

      (bookingRepository.findByEmailAndDate as jest.Mock).mockResolvedValue(null);
      (bookingRepository.findRecentByEmailAndPhone as jest.Mock).mockResolvedValue(null);
      (bookingRepository.create as jest.Mock).mockResolvedValue(mockBooking);
      (zohoCrmService.searchLead as jest.Mock).mockRejectedValue(new Error('CRM API Error'));
      (googleCalendarService.createEvent as jest.Mock).mockResolvedValue(mockCalendarEventId);
      (bookingRepository.updateCalendarDetails as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue(mockBooking);

      // Act
      const result = await siteVisitBookingService.createBooking(validBookingInput);

      // Assert
      expect(result.booking.id).toBe('booking-123');
      expect(result.crmLeadId).toBeUndefined();
      expect(result.calendarEventId).toBe(mockCalendarEventId);
      expect(result.errors).toContain('CRM integration failed');
    });
  });
});
```

#### Step 7.1.5: Create Controller Tests

**File**: `backend/src/__tests__/controllers/siteVisitBooking.controller.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../server';
import { siteVisitBookingService } from '../../services/siteVisitBooking.service';

jest.mock('../../services/siteVisitBooking.service');

describe('SiteVisitBooking Controller', () => {
  const validBookingData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    preferredDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    requirements: 'Kitchen renovation',
    source: 'website',
    utmParams: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'kitchen'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/site-visit/book', () => {
    it('should create booking successfully', async () => {
      // Arrange
      const mockResult = {
        booking: { id: 'booking-123', ...validBookingData },
        crmLeadId: 'crm-lead-456',
        calendarEventId: 'calendar-event-789',
        errors: []
      };

      (siteVisitBookingService.createBooking as jest.Mock).mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .post('/api/site-visit/book')
        .send(validBookingData)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        success: true,
        bookingId: 'booking-123',
        crmLeadId: 'crm-lead-456',
        calendarEventId: 'calendar-event-789',
        message: 'Site visit booked successfully'
      });
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidData = {
        ...validBookingData,
        email: 'invalid-email'
      };

      // Act
      const response = await request(app)
        .post('/api/site-visit/book')
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const incompleteData = {
        firstName: 'John',
        email: 'john.doe@example.com'
        // Missing other required fields
      };

      // Act
      const response = await request(app)
        .post('/api/site-visit/book')
        .send(incompleteData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });
});
```

### Task 7.2: Integration Tests

**Duration**: 3-4 days

#### Step 7.2.1: Create Integration Test

**File**: `backend/src/__tests__/integration/booking.integration.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Booking Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.booking.deleteMany();
  });

  describe('End-to-End Booking Flow', () => {
    it('should complete full booking flow', async () => {
      const bookingData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration.test@example.com',
        phone: '9876543210',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        preferredDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        requirements: 'Test requirements',
        source: 'website'
      };

      // Make the booking request
      const response = await request(app)
        .post('/api/site-visit/book')
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.bookingId).toBeDefined();

      // Verify booking was created in database
      const booking = await prisma.booking.findUnique({
        where: { id: response.body.bookingId }
      });

      expect(booking).toBeTruthy();
      expect(booking!.firstName).toBe('Integration');
      expect(booking!.lastName).toBe('Test');
      expect(booking!.email).toBe('integration.test@example.com');
    });
  });
});
```

### Task 7.3: Load Testing

**Duration**: 2-3 days

#### Step 7.3.1: Create Load Test Script

**File**: `backend/load-tests/booking-load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up
    { duration: '60s', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    errors: ['rate<0.1'], // Error rate must be below 10%
  },
};

export default function () {
  const baseUrl = 'http://localhost:8080';
  
  const bookingData = {
    firstName: `User${Math.floor(Math.random() * 1000)}`,
    lastName: 'Test',
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    phone: `987654321${Math.floor(Math.random() * 10)}`,
    address: {
      street: '123 Load Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    },
    preferredDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    requirements: 'Load test booking',
    source: 'load-test'
  };

  const response = http.post(`${baseUrl}/api/site-visit/book`, JSON.stringify(bookingData), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = check(response, {
    'status is 201': (r) => r.status === 201,
    'response has bookingId': (r) => JSON.parse(r.body).bookingId !== undefined,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!result);
  sleep(1);
}
```

### Task 7.4: Deployment Configuration

**Duration**: 2-3 days

#### Step 7.4.1: Create Production Environment Variables

**File**: `backend/.env.production.example`

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis (for queues)
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-password

# Zoho CRM
ZOHO_CLIENT_ID=your_production_zoho_client_id
ZOHO_CLIENT_SECRET=your_production_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_production_zoho_refresh_token

# Google Calendar
GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL=your-production-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Production_Private_Key\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=your_production_calendar_id@group.calendar.google.com
GOOGLE_CALENDAR_DEFAULT_ATTENDEE=admin@nestup.space

# CORS
CORS_ORIGIN=https://www.nestup.space,https://nestup.space
FRONTEND_URL=https://www.nestup.space

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Step 7.4.2: Create Docker Configuration

**File**: `backend/Dockerfile.booking`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health-check || exit 1

# Start the application
CMD ["npm", "start"]
```

#### Step 7.4.3: Create Docker Compose for Development

**File**: `docker-compose.booking.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nestup_booking
      POSTGRES_USER: nestup
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.booking
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://nestup:password@postgres:5432/nestup_booking
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=development
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## Implementation Checklist

### Phase 1: Frontend ✅

- [ ] Update form data structure
- [ ] Add validation functions
- [ ] Update API call structure
- [ ] Test form submission

### Phase 2: Backend Infrastructure ✅

- [ ] Create Booking Prisma model
- [ ] Run database migration
- [ ] Create booking repository
- [ ] Create DTOs and validation schemas

### Phase 3: External API Integrations ✅

- [ ] Install required dependencies
- [ ] Create Zoho CRM service
- [ ] Create Google Calendar service
- [ ] Set up environment variables

### Phase 4: Main Service Implementation ✅

- [ ] Create site visit booking service
- [ ] Implement business logic
- [ ] Add error handling

### Phase 5: Controller and Routes ✅

- [ ] Create booking controller
- [ ] Create route file
- [ ] Update server.ts
- [ ] Test endpoints

### Phase 6: Error Handling ✅

- [ ] Create custom error classes
- [ ] Implement retry utility
- [ ] Set up circuit breaker
- [ ] Configure queue system

### Phase 7: Testing and Deployment ✅

- [ ] Write unit tests
- [ ] Create integration tests
- [ ] Set up load testing
- [ ] Configure deployment

---

## Post-Implementation Tasks

### Monitoring Setup

1. Set up application monitoring (New Relic, DataDog, etc.)
2. Configure error tracking (Sentry)
3. Set up log aggregation (ELK stack)
4. Create alerts for critical failures

### Documentation

1. API documentation (Swagger/OpenAPI)
2. Setup and deployment guides
3. Troubleshooting documentation
4. User guides for admin functionality

### Security Review

1. Security audit of API endpoints
2. Rate limiting configuration
3. Input sanitization review
4. Authentication and authorization review

### Performance Optimization

1. Database query optimization
2. API response caching
3. CDN setup for static assets
4. Database connection pooling

### Backup and Recovery

1. Database backup strategy
2. Disaster recovery plan
3. Data retention policies
4. Recovery testing procedures

---

## Success Criteria

### Technical Metrics

- [ ] 99% API uptime
- [ ] <2 second response time for booking creation
- [ ] <5% error rate for CRM/Calendar integrations
- [ ] 100% data consistency between systems

### Business Metrics

- [ ] 95% successful booking completion rate
- [ ] Zero data loss incidents
- [ ] 24/7 system availability
- [ ] Automated lead follow-up within 1 hour

### User Experience

- [ ] Intuitive booking form
- [ ] Clear error messages
- [ ] Instant booking confirmation
- [ ] Mobile-responsive design

---

This comprehensive implementation guide provides step-by-step instructions for implementing the NestUp Site Visit Booking CRM Integration. Each phase builds upon the previous one, ensuring a robust and scalable solution that meets all the requirements specified in the Product Requirements Document.

The implementation follows industry best practices for error handling, testing, and deployment, making it production-ready and maintainable for long-term use.
