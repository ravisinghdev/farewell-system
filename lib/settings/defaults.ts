import { FarewellSettings, JoinMethod, PaymentSplitMode } from "./schema";

export const DEFAULT_FAREWELL_SETTINGS: FarewellSettings = {
  general: {
    farewell_name: "Farewell 2025",
    academic_year: "2024-2025",
    sections: [],
    event_date: null,
    timezone: "Asia/Kolkata",
    currency: "INR",
    locale: "en-IN",
    is_maintenance_mode: false,
    is_archived: false,
  },
  roles: {
    admin: {
      can_create_duties: true,
      can_manage_finance: true,
      can_post_announcements: true,
      can_invite_users: true,
      can_edit_settings: true,
    },
    teacher: {
      can_create_duties: true,
      can_manage_finance: false,
      can_post_announcements: true,
      can_invite_users: true,
      can_edit_settings: false,
    },
    student: {
      can_create_duties: false,
      can_manage_finance: false,
      can_post_announcements: false,
      can_invite_users: false,
      can_edit_settings: false,
    },
  },
  joining: {
    join_method: JoinMethod.APPROVAL,
    allow_guests: false,
    auto_assign_role_domain: [],
    joining_locked: false,
  },
  finance: {
    target_budget: 50000,
    split_mode: PaymentSplitMode.EQUAL,
    contribution_min: 0,
    accepting_payments: true,
    allow_offline_payments: true,
    allow_partial_payments: true,
    tax_percentage: 0,
  },
  duties: {
    enable_duties: true,
    admin_only_creation: true,
    max_active_duties_per_user: 3,
    require_receipt_proof: true,
    auto_approve_limit: 200, // Auto-approve small amounts
  },
  communication: {
    enable_chat: true,
    enable_announcements: true,
    admin_only_announcements: true,
    allow_media_in_chat: true,
    enable_reactions: true,
  },
  notifications: {
    enable_email_notifications: true,
    enable_push_notifications: true,
    enable_whatsapp_notifications: false,
    admin_digest_frequency: "daily",
    student_digest_frequency: "weekly",
  },
  features: {
    enable_ai_moderation: false,
    enable_ocr_receipts: false,
    enable_gallery: true,
  },
};
