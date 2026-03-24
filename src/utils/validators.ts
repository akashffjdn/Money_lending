import { z } from 'zod';

export const phoneSchema = z.string()
  .length(10, 'Phone number must be 10 digits')
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number');

export const panSchema = z.string()
  .length(10, 'PAN must be 10 characters')
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format');

export const aadhaarSchema = z.string()
  .length(12, 'Aadhaar must be 12 digits')
  .regex(/^\d{12}$/, 'Invalid Aadhaar number');

export const pincodeSchema = z.string()
  .length(6, 'Pincode must be 6 digits')
  .regex(/^\d{6}$/, 'Invalid pincode');

export const emailSchema = z.string().email('Invalid email address');

export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

export const personalInfoSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Please select gender' }),
});

export const loginSchema = z.object({
  phone: phoneSchema,
});
