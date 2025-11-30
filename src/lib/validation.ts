import { z } from 'zod';

// XMR address validation (Monero addresses start with 4 or 8 and are 95 characters long)
export const xmrAddressSchema = z
  .string()
  .regex(/^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/, 'Invalid Monero address format')
  .or(z.literal(''));

// Listing validation schema
export const listingSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  priceUsd: z.number()
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must be less than $1,000,000'),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

// Auth validation schemas
export const emailSchema = z.string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const displayNameSchema = z.string()
  .trim()
  .min(2, 'Display name must be at least 2 characters')
  .max(50, 'Display name must be less than 50 characters');

// Settings validation schema
export const settingsSchema = z.object({
  displayName: displayNameSchema,
  xmrAddress: xmrAddressSchema,
});
