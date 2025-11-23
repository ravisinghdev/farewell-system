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
          description: string | null
          farewell_id: string | null
          id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          farewell_id?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          farewell_id?: string | null
          id?: string
          title?: string | null
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
      announcements: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          farewell_id: string | null
          id: string
          pinned: boolean | null
          starts_at: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          farewell_id?: string | null
          id?: string
          pinned?: boolean | null
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          farewell_id?: string | null
          id?: string
          pinned?: boolean | null
          starts_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          payload: Json | null
          resource: string | null
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          resource?: string | null
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          resource?: string | null
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string | null
          farewell_id: string
          id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          farewell_id: string
          id?: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          farewell_id?: string
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          farewell_id: string
          id: string
          metadata: Json | null
          method: string
          payer_id: string | null
          receipt_url: string | null
          reference: string | null
          split: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          farewell_id: string
          id?: string
          metadata?: Json | null
          method: string
          payer_id?: string | null
          receipt_url?: string | null
          reference?: string | null
          split?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          farewell_id?: string
          id?: string
          metadata?: Json | null
          method?: string
          payer_id?: string | null
          receipt_url?: string | null
          reference?: string | null
          split?: Json | null
          status?: string
          updated_at?: string | null
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
            foreignKeyName: "contributions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_storage_path: string | null
          seen_by: Json | null
          sender_id: string | null
          thread_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_storage_path?: string | null
          seen_by?: Json | null
          sender_id?: string | null
          thread_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_storage_path?: string | null
          seen_by?: Json | null
          sender_id?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          created_at: string | null
          id: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_threads_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_threads_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      duties: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          expense_limit: number | null
          farewell_id: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          expense_limit?: number | null
          farewell_id: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          expense_limit?: number | null
          farewell_id?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duties_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_assignments: {
        Row: {
          assigned_at: string | null
          duty_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          duty_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          duty_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_assignments_duty_id_fkey"
            columns: ["duty_id"]
            isOneToOne: false
            referencedRelation: "duties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_receipts: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          currency: string
          duty_assignment_id: string | null
          id: string
          meta: Json | null
          receipt_storage_path: string | null
          status: string | null
          uploader_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          currency?: string
          duty_assignment_id?: string | null
          id?: string
          meta?: Json | null
          receipt_storage_path?: string | null
          status?: string | null
          uploader_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          currency?: string
          duty_assignment_id?: string | null
          id?: string
          meta?: Json | null
          receipt_storage_path?: string | null
          status?: string | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duty_receipts_duty_assignment_id_fkey"
            columns: ["duty_assignment_id"]
            isOneToOne: false
            referencedRelation: "duty_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_receipts_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      farewell_members: {
        Row: {
          active: boolean | null
          farewell_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          farewell_id: string
          id?: string
          joined_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          farewell_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
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
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          name: string
          section: string
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name: string
          section: string
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          section?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "farewells_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          farewell_id: string | null
          id: string
          meta: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          farewell_id?: string | null
          id?: string
          meta?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          farewell_id?: string | null
          id?: string
          meta?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          album_id: string | null
          created_at: string | null
          farewell_id: string | null
          filename: string | null
          id: string
          metadata: Json | null
          mime: string | null
          size_bytes: number | null
          storage_path: string | null
          uploader_id: string | null
        }
        Insert: {
          album_id?: string | null
          created_at?: string | null
          farewell_id?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          mime?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          uploader_id?: string | null
        }
        Update: {
          album_id?: string | null
          created_at?: string | null
          farewell_id?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          mime?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_storage_path: string | null
          reply_to: string | null
          sender_id: string | null
          status: string | null
          thread_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_storage_path?: string | null
          reply_to?: string | null
          sender_id?: string | null
          status?: string | null
          thread_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_storage_path?: string | null
          reply_to?: string | null
          sender_id?: string | null
          status?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          farewell_id: string | null
          id: string
          meta: Json | null
          read_by: Json | null
          target: Json | null
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          farewell_id?: string | null
          id?: string
          meta?: Json | null
          read_by?: Json | null
          target?: Json | null
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          farewell_id?: string | null
          id?: string
          meta?: Json | null
          read_by?: Json | null
          target?: Json | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_farewell_id_fkey"
            columns: ["farewell_id"]
            isOneToOne: false
            referencedRelation: "farewells"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_offline: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          contribution_id: string | null
          created_at: string | null
          id: string
          receipt_storage_path: string | null
          recorded_by: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          contribution_id?: string | null
          created_at?: string | null
          id?: string
          receipt_storage_path?: string | null
          recorded_by?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          contribution_id?: string | null
          created_at?: string | null
          id?: string
          receipt_storage_path?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_offline_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_offline_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          contribution_id: string | null
          created_at: string | null
          gateway: string | null
          gateway_id: string | null
          gateway_payload: Json | null
          id: string
          status: string | null
        }
        Insert: {
          contribution_id?: string | null
          created_at?: string | null
          gateway?: string | null
          gateway_id?: string | null
          gateway_payload?: Json | null
          id?: string
          status?: string | null
        }
        Update: {
          contribution_id?: string | null
          created_at?: string | null
          gateway?: string | null
          gateway_id?: string | null
          gateway_payload?: Json | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          id: string
          role_id: number
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          role_id: number
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
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
          display_name: string | null
          email: string | null
          id: string
          metadata: Json | null
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_farewell_member_roles: {
        Row: {
          farewell_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          farewell_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          farewell_id?: string | null
          role?: string | null
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
    }
    Functions: {
      add_media_file: { Args: { payload: Json }; Returns: string }
      approve_duty_receipt: { Args: { receipt_id: string }; Returns: Json }
      assign_duty: {
        Args: { duty_id: string; user_ids: string[] }
        Returns: Json
      }
      claim_invite: {
        Args: { p_code: string; p_user_id: string }
        Returns: string
      }
      create_album: {
        Args: { farewell_id: string; title: string }
        Returns: string
      }
      create_dm_thread: { Args: { user_b: string }; Returns: string }
      create_farewell: { Args: { farewell_info: Json }; Returns: Json }
      create_group_thread: {
        Args: { farewell_id: string; title: string }
        Returns: string
      }
      join_farewell: { Args: { farewell_id: string }; Returns: Json }
      record_offline_payment: {
        Args: { amount: number; contribution_id: string }
        Returns: Json
      }
      reject_duty_receipt: {
        Args: { reason: string; receipt_id: string }
        Returns: Json
      }
      rls_current_jwt_farewell_id: { Args: never; Returns: string }
      rls_current_user_id: { Args: never; Returns: string }
      rls_current_user_is_admin: { Args: never; Returns: boolean }
      rls_is_admin: { Args: { u_id: string }; Returns: boolean }
      rls_is_member_of_farewell: {
        Args: { f_id: string; u_id: string }
        Returns: boolean
      }
      send_dm_message: {
        Args: { content: string; thread_id: string }
        Returns: Json
      }
      send_group_message: {
        Args: { content: string; thread_id: string }
        Returns: Json
      }
      set_user_farewell_claim: {
        Args: { farewell_id: string }
        Returns: undefined
      }
      unassign_duty: { Args: { assignment_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
