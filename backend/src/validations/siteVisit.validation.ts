import { z } from 'zod';

// Schema for validating the book site visit request body
export const bookSiteVisitSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 digits' })
      .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }), // Basic E.164 format check
    projectName: z.string().min(1, { message: 'Project name is required' }),
    projectAddress: z.string().min(1, { message: 'Project address is required' }),
    projectLocation: z.string().min(1, { message: 'Project location is required' }),
    preferredSlot: z.string().datetime({ message: 'Preferred slot must be a valid ISO 8601 date string' }),
  }),
});

// Type inferred from the schema for controller usage
export type BookSiteVisitInput = z.infer<typeof bookSiteVisitSchema>['body'];
