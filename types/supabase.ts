export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          status: "online" | "offline" | "away" | "busy";
          last_seen_at: string | null;
          public_key: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          status?: "online" | "offline" | "away" | "busy";
          last_seen_at?: string | null;
          public_key?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          status?: "online" | "offline" | "away" | "busy";
          last_seen_at?: string | null;
          public_key?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      farewells: {
        Row: {
          id: string;
          name: string;
          year: number;
          section: string | null;
          date: string | null;
          code: string | null;
          requires_approval: boolean;
          status: "active" | "archived";
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          year: number;
          section?: string | null;
          date?: string | null;
          code?: string | null;
          requires_approval?: boolean;
          status?: "active" | "archived";
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          year?: number;
          section?: string | null;
          date?: string | null;
          code?: string | null;
          requires_approval?: boolean;
          status?: "active" | "archived";
          created_by?: string | null;
          created_at?: string | null;
        };
      };
      farewell_members: {
        Row: {
          id: string;
          farewell_id: string;
          user_id: string;
          role: "admin" | "student" | "guest";
          status: "pending" | "approved" | "rejected";
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          farewell_id: string;
          user_id: string;
          role?: "admin" | "student" | "guest";
          status?: "pending" | "approved" | "rejected";
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          farewell_id?: string;
          user_id?: string;
          role?: "admin" | "student" | "guest";
          status?: "pending" | "approved" | "rejected";
          joined_at?: string | null;
        };
      };
      chat_channels: {
        Row: {
          id: string;
          type: "dm" | "group" | "farewell" | "class";
          scope_id: string | null;
          name: string | null;
          avatar_url: string | null;
          created_by: string | null;
          last_message_at: string | null;
          is_deleted: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          type?: "dm" | "group" | "farewell" | "class";
          scope_id?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          last_message_at?: string | null;
          is_deleted?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          type?: "dm" | "group" | "farewell" | "class";
          scope_id?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          last_message_at?: string | null;
          is_deleted?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      chat_members: {
        Row: {
          channel_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          status: "active" | "muted" | "blocked" | "left" | "pending";
          last_read_at: string | null;
          is_pinned: boolean;
          joined_at: string | null;
        };
        Insert: {
          channel_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          status?: "active" | "muted" | "blocked" | "left" | "pending";
          last_read_at?: string | null;
          is_pinned?: boolean;
          joined_at?: string | null;
        };
        Update: {
          channel_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          status?: "active" | "muted" | "blocked" | "left" | "pending";
          last_read_at?: string | null;
          is_pinned?: boolean;
          joined_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string | null;
          content: string | null;
          type: "text" | "image" | "file" | "system";
          file_url: string | null;
          reply_to_id: string | null;
          is_edited: boolean;
          is_deleted: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id?: string | null;
          content?: string | null;
          type?: "text" | "image" | "file" | "system";
          file_url?: string | null;
          reply_to_id?: string | null;
          is_edited?: boolean;
          is_deleted?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string | null;
          content?: string | null;
          type?: "text" | "image" | "file" | "system";
          file_url?: string | null;
          reply_to_id?: string | null;
          is_edited?: boolean;
          is_deleted?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      chat_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string | null;
        };
      };
      polls: {
        Row: {
          id: string;
          farewell_id: string | null;
          question: string;
          created_by: string | null;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          farewell_id?: string | null;
          question: string;
          created_by?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          farewell_id?: string | null;
          question?: string;
          created_by?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string | null;
          option_text: string;
        };
        Insert: {
          id?: string;
          poll_id?: string | null;
          option_text: string;
        };
        Update: {
          id?: string;
          poll_id?: string | null;
          option_text?: string;
        };
      };
      poll_votes: {
        Row: {
          id: string;
          poll_id: string | null;
          option_id: string | null;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          poll_id?: string | null;
          option_id?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          poll_id?: string | null;
          option_id?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
      };
      tickets: {
        Row: {
          id: string;
          farewell_id: string | null;
          user_id: string | null;
          ticket_code: string | null;
          qr_code_url: string | null;
          is_scanned: boolean;
          scanned_at: string | null;
          scanned_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          farewell_id?: string | null;
          user_id?: string | null;
          ticket_code?: string | null;
          qr_code_url?: string | null;
          is_scanned?: boolean;
          scanned_at?: string | null;
          scanned_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          farewell_id?: string | null;
          user_id?: string | null;
          ticket_code?: string | null;
          qr_code_url?: string | null;
          is_scanned?: boolean;
          scanned_at?: string | null;
          scanned_by?: string | null;
          created_at?: string | null;
        };
      };
      confessions: {
        Row: {
          id: string;
          farewell_id: string | null;
          content: string;
          is_approved: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          farewell_id?: string | null;
          content: string;
          is_approved?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          farewell_id?: string | null;
          content?: string;
          is_approved?: boolean;
          created_at?: string | null;
        };
      };
      contributions: {
        Row: {
          id: string;
          user_id: string;
          farewell_id: string;
          amount: number;
          method: "upi" | "cash" | "bank_transfer";
          transaction_id: string | null;
          screenshot_url: string | null;
          status: "pending" | "verified" | "rejected";
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          farewell_id: string;
          amount: number;
          method: "upi" | "cash" | "bank_transfer";
          transaction_id?: string | null;
          screenshot_url?: string | null;
          status?: "pending" | "verified" | "rejected";
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          farewell_id?: string;
          amount?: number;
          method?: "upi" | "cash" | "bank_transfer";
          transaction_id?: string | null;
          screenshot_url?: string | null;
          status?: "pending" | "verified" | "rejected";
          created_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_status: "online" | "offline" | "away" | "busy";
      farewell_status: "active" | "archived";
      farewell_role: "admin" | "student" | "guest";
      join_status: "pending" | "approved" | "rejected";
      channel_type: "dm" | "group" | "farewell" | "class";
      member_role: "owner" | "admin" | "member";
      member_status: "active" | "muted" | "blocked" | "left" | "pending";
      message_type: "text" | "image" | "file" | "system";
      contribution_status: "pending" | "verified" | "rejected";
      media_type: "image" | "video";
      duty_status: "pending" | "in_progress" | "completed";
      notif_type:
        | "message"
        | "mention"
        | "system"
        | "request"
        | "finance"
        | "duty";
    };
  };
}
