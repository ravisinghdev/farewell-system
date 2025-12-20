import { z } from "zod";

// --- Enums ---

export enum PaymentSplitMode {
  EQUAL = "equal",
  WEIGHTED = "weighted",
  CUSTOM = "custom",
}

export enum JoinMethod {
  AUTO = "auto",
  APPROVAL = "approval",
  INVITE_CODE = "invite_code",
  QR_CODE = "qr_code",
}

// --- Zod Schemas ---

export const generalSettingsSchema = z.object({
  farewell_name: z.string().min(1, "Farewell name is required"),
  academic_year: z.string().optional(),
  sections: z.array(z.string()).default([]),
  event_date: z.string().nullable().optional(),
  timezone: z.string().default("Asia/Kolkata"),
  currency: z.string().default("INR"),
  locale: z.string().default("en-IN"),
  is_maintenance_mode: z.boolean().default(false),
  is_archived: z.boolean().default(false),
  support_email: z.string().email().optional(),
});

export const rolePermissionsSchema = z.record(
  z.string(), // Role name (e.g., 'teacher', 'student', 'admin')
  z.object({
    can_create_duties: z.boolean().default(false),
    can_manage_finance: z.boolean().default(false),
    can_post_announcements: z.boolean().default(false),
    can_invite_users: z.boolean().default(false),
    can_edit_settings: z.boolean().default(false),
    max_receipt_amount: z.number().nullable().optional(), // Null = unlimited
  })
);

export const joiningSettingsSchema = z.object({
  join_method: z.nativeEnum(JoinMethod).default(JoinMethod.APPROVAL),
  allow_guests: z.boolean().default(false),
  max_users: z.number().int().optional(),
  auto_assign_role_domain: z
    .array(z.object({ domain: z.string(), role: z.string() }))
    .default([]),
  invite_code: z.string().optional(),
  joining_locked: z.boolean().default(false),
});

export const financeSettingsSchema = z.object({
  target_budget: z.number().min(0).default(50000),
  split_mode: z.nativeEnum(PaymentSplitMode).default(PaymentSplitMode.EQUAL),
  contribution_min: z.number().min(0).default(0),
  contribution_max: z.number().min(0).optional(),
  accepting_payments: z.boolean().default(true),
  allow_offline_payments: z.boolean().default(true),
  allow_partial_payments: z.boolean().default(true),
  upi_id: z.string().optional(),
  tax_percentage: z.number().min(0).default(0),
});

export const dutySettingsSchema = z.object({
  enable_duties: z.boolean().default(true),
  admin_only_creation: z.boolean().default(true),
  max_active_duties_per_user: z.number().int().default(3),
  require_receipt_proof: z.boolean().default(true),
  auto_approve_limit: z.number().min(0).default(0), // 0 to disable
});

export const communicationSettingsSchema = z.object({
  enable_chat: z.boolean().default(true),
  enable_announcements: z.boolean().default(true),
  admin_only_announcements: z.boolean().default(true),
  allow_media_in_chat: z.boolean().default(true),
  enable_reactions: z.boolean().default(true),
});

export const notificationsSettingsSchema = z.object({
  enable_email_notifications: z.boolean().default(true),
  enable_push_notifications: z.boolean().default(true),
  enable_whatsapp_notifications: z.boolean().default(false), // Optional integration
  admin_digest_frequency: z.enum(["daily", "weekly", "never"]).default("daily"),
  student_digest_frequency: z
    .enum(["daily", "weekly", "never"])
    .default("weekly"),
});

export const featureFlagsSchema = z.object({
  enable_ai_moderation: z.boolean().default(false),
  enable_ocr_receipts: z.boolean().default(false),
  enable_gallery: z.boolean().default(true),
});

// --- Main Settings Object ---

export const farewellSettingsSchema = z.object({
  general: generalSettingsSchema,
  roles: rolePermissionsSchema.default({}),
  joining: joiningSettingsSchema,
  finance: financeSettingsSchema,
  duties: dutySettingsSchema,
  communication: communicationSettingsSchema,
  notifications: notificationsSettingsSchema,
  features: featureFlagsSchema,
});

export type FarewellSettings = z.infer<typeof farewellSettingsSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type RolePermissions = z.infer<typeof rolePermissionsSchema>;
export type JoiningSettings = z.infer<typeof joiningSettingsSchema>;
export type FinanceSettings = z.infer<typeof financeSettingsSchema>;
export type DutySettings = z.infer<typeof dutySettingsSchema>;
export type CommunicationSettings = z.infer<typeof communicationSettingsSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSettingsSchema>;
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  bio: z.string().max(160).optional(),
  phone: z.string().optional(),
  notifications: z
    .object({
      enable_email_notifications: z.boolean().default(true),
      enable_push_notifications: z.boolean().default(true),
      enable_whatsapp_notifications: z.boolean().default(false),
    })
    .default({
      enable_email_notifications: true,
      enable_push_notifications: true,
      enable_whatsapp_notifications: false,
    }),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
