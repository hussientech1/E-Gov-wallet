export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_username: string
          created_at: string | null
          ip_address: string
          log_id: number
        }
        Insert: {
          action: string
          admin_username: string
          created_at?: string | null
          ip_address: string
          log_id?: number
        }
        Update: {
          action?: string
          admin_username?: string
          created_at?: string | null
          ip_address?: string
          log_id?: number
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          admin_id: number
          created_at: string | null
          full_name: string
          is_active: boolean | null
          password: string
          username: string
        }
        Insert: {
          admin_id?: number
          created_at?: string | null
          full_name: string
          is_active?: boolean | null
          password: string
          username: string
        }
        Update: {
          admin_id?: number
          created_at?: string | null
          full_name?: string
          is_active?: boolean | null
          password?: string
          username?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          is_read: boolean | null
          message: string
          national_number: string | null
          notification_id: number
          status_type: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          is_read?: boolean | null
          message: string
          national_number?: string | null
          notification_id?: number
          status_type?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          is_read?: boolean | null
          message?: string
          national_number?: string | null
          notification_id?: number
          status_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_national_number_fkey"
            columns: ["national_number"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_number"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          national_number: string | null
          token: string
          token_id: number
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          national_number?: string | null
          token: string
          token_id?: number
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          national_number?: string | null
          token?: string
          token_id?: number
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_national_number_fkey"
            columns: ["national_number"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_number"]
          },
        ]
      }
      service_applications: {
        Row: {
          application_id: number
          application_status: string | null
          emergency_reason: string | null
          invoice_number: string
          national_number: string | null
          office_location: string
          payment_status: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: number | null
          submitted_at: string | null
        }
        Insert: {
          application_id?: number
          application_status?: string | null
          emergency_reason?: string | null
          invoice_number: string
          national_number?: string | null
          office_location: string
          payment_status?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: number | null
          submitted_at?: string | null
        }
        Update: {
          application_id?: number
          application_status?: string | null
          emergency_reason?: string | null
          invoice_number?: string
          national_number?: string | null
          office_location?: string
          payment_status?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: number | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_applications_national_number_fkey"
            columns: ["national_number"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_number"]
          },
          {
            foreignKeyName: "service_applications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      services: {
        Row: {
          description: string | null
          fee: number | null
          is_active: boolean | null
          processing_time: string | null
          required_documents: string[] | null
          service_id: number
          service_name: string
        }
        Insert: {
          description?: string | null
          fee?: number | null
          is_active?: boolean | null
          processing_time?: string | null
          required_documents?: string[] | null
          service_id?: number
          service_name: string
        }
        Update: {
          description?: string | null
          fee?: number | null
          is_active?: boolean | null
          processing_time?: string | null
          required_documents?: string[] | null
          service_id?: number
          service_name?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string | null
          message: string | null
          national_number: string | null
          request_id: number
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          message?: string | null
          national_number?: string | null
          request_id?: number
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          message?: string | null
          national_number?: string | null
          request_id?: number
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_national_number_fkey"
            columns: ["national_number"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_number"]
          },
        ]
      }
      user_documents: {
        Row: {
          created_at: string | null
          doc_id: number
          doc_number: string
          doc_type: Database["public"]["Enums"]["document_type"]
          document_status: Database["public"]["Enums"]["document_status"] | null
          expiry_date: string | null
          issue_date: string
          national_number: string | null
          qr_code: string | null
        }
        Insert: {
          created_at?: string | null
          doc_id?: number
          doc_number: string
          doc_type: Database["public"]["Enums"]["document_type"]
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          expiry_date?: string | null
          issue_date: string
          national_number?: string | null
          qr_code?: string | null
        }
        Update: {
          created_at?: string | null
          doc_id?: number
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          expiry_date?: string | null
          issue_date?: string
          national_number?: string | null
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_national_number_fkey"
            columns: ["national_number"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_number"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string | null
          dark_mode_enabled: boolean | null
          email: string | null
          full_name: string
          gender: string | null
          language_preference: string | null
          national_number: string
          password_hash: string
          phone_number: string
          profile_completed: boolean | null
          profile_picture: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          email?: string | null
          full_name: string
          gender?: string | null
          language_preference?: string | null
          national_number: string
          password_hash: string
          phone_number: string
          profile_completed?: boolean | null
          profile_picture?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          email?: string | null
          full_name?: string
          gender?: string | null
          language_preference?: string | null
          national_number?: string
          password_hash?: string
          phone_number?: string
          profile_completed?: boolean | null
          profile_picture?: string | null
          state?: string | null
        }
        Relationships: []
      }
      uploaded_documents: {
        Row: {
          upload_id: number
          application_id: number
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          upload_status: string
          rejection_reason: string | null
          uploaded_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          upload_id?: number
          application_id: number
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          upload_status?: string
          rejection_reason?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          upload_id?: number
          application_id?: number
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          upload_status?: string
          rejection_reason?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "service_applications"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "uploaded_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["username"]
          }
        ]
      }
      print_queue: {
        Row: {
          queue_id: number
          application_id: number
          national_number: string
          user_full_name: string
          service_type: string
          service_id: number
          approval_date: string | null
          print_status: string | null
          printed_at: string | null
          printed_by: string | null
          office_location: string
          document_id: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          queue_id?: number
          application_id: number
          national_number: string
          user_full_name: string
          service_type: string
          service_id: number
          approval_date?: string | null
          print_status?: string | null
          printed_at?: string | null
          printed_by?: string | null
          office_location: string
          document_id?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          queue_id?: number
          application_id?: number
          national_number?: string
          user_full_name?: string
          service_type?: string
          service_id?: number
          approval_date?: string | null
          print_status?: string | null
          printed_at?: string | null
          printed_by?: string | null
          office_location?: string
          document_id?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "print_queue_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "service_applications"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "print_queue_national_number_fkey"
            columns: ["national_number"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_number"]
          },
          {
            foreignKeyName: "print_queue_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "print_queue_printed_by_fkey"
            columns: ["printed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["username"]
          },
          {
            foreignKeyName: "print_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["doc_id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login: {
        Args: { p_username: string; p_password: string }
        Returns: Json
      }
      admin_review_application: {
        Args: {
          p_admin_username: string
          p_application_id: number
          p_approve: boolean
          p_rejection_reason?: string
        }
        Returns: Json
      }
      custom_login: {
        Args: { p_national_number: string; p_password: string }
        Returns: Json
      }
      get_admin_applications: {
        Args: {
          p_status?: string
          p_service_id?: number
          p_offset?: number
          p_limit?: number
        }
        Returns: {
          application_id: number
          national_number: string
          service_id: number
          service_name: string
          submitted_at: string
          reviewed_at: string
          application_status: string
          payment_status: string
          office_location: string
          invoice_number: string
          emergency_reason: string
          rejection_reason: string
          reviewed_by: string
          full_name: string
        }[]
      }
      get_services: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string | null
          fee: number | null
          is_active: boolean | null
          processing_time: string | null
          required_documents: string[] | null
          service_id: number
          service_name: string
        }[]
      }
      get_user_documents: {
        Args: { p_national_number: string }
        Returns: {
          created_at: string | null
          doc_id: number
          doc_number: string
          doc_type: Database["public"]["Enums"]["document_type"]
          document_status: Database["public"]["Enums"]["document_status"] | null
          expiry_date: string | null
          issue_date: string
          national_number: string | null
          qr_code: string | null
        }[]
      }
      get_user_notifications: {
        Args: { p_national_number: string }
        Returns: {
          created_at: string | null
          is_read: boolean | null
          message: string
          national_number: string | null
          notification_id: number
          status_type: string | null
          title: string
        }[]
      }
      handle_auth_login: {
        Args: { p_national_number: string; p_password: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { p_notification_id: number; p_national_number: string }
        Returns: boolean
      }
      register_user: {
        Args:
          | {
              p_national_number: string
              p_full_name: string
              p_phone_number: string
              p_password: string
            }
          | {
              p_national_number: string
              p_full_name: string
              p_phone_number: string
              p_password: string
              p_gender?: string
              p_state?: string
              p_address?: string
              p_email?: string
            }
        Returns: Json
      }
      submit_service_application: {
        Args: {
          p_national_number: string
          p_service_id: number
          p_invoice_number: string
          p_office_location: string
          p_is_emergency: boolean
          p_emergency_reason?: string
        }
        Returns: Json
      }
    }
    Enums: {
      doc_type:
        | "passport"
        | "id_card"
        | "birth_certificate"
        | "marriage_certificate"
      document_status: "active" | "expired" | "pending" | "cancelled"
      document_type:
        | "passport"
        | "national_id"
        | "birth_certificate"
        | "driver_license"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      doc_type: [
        "passport",
        "id_card",
        "birth_certificate",
        "marriage_certificate",
      ],
      document_status: ["active", "expired", "pending", "cancelled"],
      document_type: [
        "passport",
        "national_id",
        "birth_certificate",
        "driver_license",
      ],
    },
  },
} as const
