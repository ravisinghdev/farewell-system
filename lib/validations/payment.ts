import { z } from "zod";

// Amount validation (₹1 - ₹1,00,000)
export const amountSchema = z
  .number()
  .min(1, "Amount must be at least ₹1")
  .max(100000, "Amount cannot exceed ₹1,00,000")
  .positive("Amount must be positive");

// UPI ID validation (username@bank)
export const upiIdSchema = z
  .string()
  .min(5, "UPI ID is too short")
  .regex(
    /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/,
    "Invalid UPI ID format (e.g., name@upi)"
  );

// Transaction ID validation
export const transactionIdSchema = z
  .string()
  .min(10, "Transaction ID must be at least 10 characters")
  .max(25, "Transaction ID is too long")
  .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers allowed");

// Screenshot validation
export const screenshotSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, "File must be less than 5MB"),
  type: z
    .string()
    .refine(
      (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
      "Only JPEG, PNG, or WebP images allowed"
    ),
});

// Payment submission
export const paymentSubmissionSchema = z.object({
  farewellId: z.string().uuid(),
  amount: amountSchema,
  transactionId: transactionIdSchema,
  screenshotUrl: z.string().url().optional(),
});
