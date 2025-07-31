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
