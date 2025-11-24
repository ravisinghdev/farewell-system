export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          created_at: string | null
          created_by: string | null
          farewell_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          farewell_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          farewell_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          farewell_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          farewell_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          farewell_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string | null
          farewell_id: string | null
          id: string
          name: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          name?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          channel_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string | null
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          reply_to: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          created_at: string | null
          farewell_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          screenshot_url: string | null
          status: Database["public"]["Enums"]["contribution_status"] | null
          transaction_id: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
          transaction_id?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["contribution_status"] | null
          transaction_id?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      duties: {
        Row: {
          assigned_to: string[] | null
          created_at: string | null
          description: string | null
          farewell_id: string | null
          id: string
          status: Database["public"]["Enums"]["duty_status"] | null
          title: string
        }
        Insert: {
          assigned_to?: string[] | null
          created_at?: string | null
          description?: string | null
          farewell_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["duty_status"] | null
          title: string
        }
        Update: {
          assigned_to?: string[] | null
          created_at?: string | null
          description?: string | null
          farewell_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["duty_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "duties_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string | null
          created_at: string | null
          farewell_id: string | null
          id: string
          paid_by: string | null
          receipt_url: string | null
          title: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          paid_by?: string | null
          receipt_url?: string | null
          title: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          paid_by?: string | null
          receipt_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      farewell_join_requests: {
        Row: {
          created_at: string | null
          farewell_id: string | null
          id: string
          status: Database["public"]["Enums"]["join_status"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["join_status"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["join_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farewell_join_requests_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farewell_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      farewell_members: {
        Row: {
          active: boolean | null
          farewell_id: string | null
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          farewell_id?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          farewell_id?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farewell_members_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farewell_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      farewells: {
        Row: {
          code: string | null
          created_at: string | null
          date: string | null
          id: string
          name: string
          requires_approval: boolean | null
          section: string | null
          status: string | null
          year: number
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          name: string
          requires_approval?: boolean | null
          section?: string | null
          status?: string | null
          year: number
        }
        Update: {
          code?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          name?: string
          requires_approval?: boolean | null
          section?: string | null
          status?: string | null
          year?: number
        }
        Relationships: []
      }
      media: {
        Row: {
          album_id: string | null
          created_at: string | null
          id: string
          type: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          album_id?: string | null
          created_at?: string | null
          id?: string
          type: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          album_id?: string | null
          created_at?: string | null
          id?: string
          type?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      song_requests: {
        Row: {
          artist: string | null
          created_at: string | null
          farewell_id: string | null
          id: string
          song_name: string
          status: string | null
          user_id: string | null
          votes: number | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          song_name: string
          status?: string | null
          user_id?: string | null
          votes?: number | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          farewell_id?: string | null
          id?: string
          song_name?: string
          status?: string | null
          user_id?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contribution_status: "pending" | "verified" | "rejected"
      duty_status: "pending" | "in_progress" | "completed"
      join_status: "pending" | "approved" | "rejected"
      notification_type: "info" | "warning" | "success" | "error"
      payment_method: "upi" | "cash" | "bank_transfer"
      user_role: "student" | "teacher" | "parallel_admin" | "main_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contribution_status: ["pending", "verified", "rejected"],
      duty_status: ["pending", "in_progress", "completed"],
      join_status: ["pending", "approved", "rejected"],
      notification_type: ["info", "warning", "success", "error"],
      payment_method: ["upi", "cash", "bank_transfer"],
      user_role: ["student", "teacher", "parallel_admin", "main_admin"],
    },
  },
} as const
