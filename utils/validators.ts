// utils/validators.ts
import { z } from "zod";

/*
  Signup Validation
  - Email must be valid format
  - Password min length 8
  - Optional username (3–32 chars)
*/
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3).max(32).optional(),
  fullName: z.string().min(2, "Full name is required"),
  grade: z.coerce.number().min(1).max(12).optional(),
  section: z.string().max(10).optional(),
});

/*
  Signin Validation
  - Email must be valid format
  - Password must be provided
*/
export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

/*
  Magic Link Login Validation
  - Email only
*/
export const MagicLinkSchema = z.object({
  email: z.string().email(),
});
