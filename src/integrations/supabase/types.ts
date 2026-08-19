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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      appointment_types: {
        Row: {
          active: boolean
          color: string
          created_at: string
          default_price: number
          duration_minutes: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          default_price?: number
          duration_minutes?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          default_price?: number
          duration_minutes?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type_id: string | null
          created_at: string
          created_by: string | null
          date: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string | null
          patient_package_id: string | null
          start_minutes: number
          status: Database["public"]["Enums"]["appointment_status"]
          therapist_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          appointment_type_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_package_id?: string | null
          start_minutes: number
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          appointment_type_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_package_id?: string | null
          start_minutes?: number
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_package_id_fkey"
            columns: ["patient_package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          cancellation_hours: number
          charge_late_cancel: boolean
          charge_no_show: boolean
          clinic_name: string
          currency: string
          day_end: number
          day_start: number
          default_duration: number
          default_package_validity: number
          email: string | null
          id: boolean
          logo_url: string | null
          low_sessions_threshold: number
          phone: string | null
          reminder_hours: number[]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cancellation_hours?: number
          charge_late_cancel?: boolean
          charge_no_show?: boolean
          clinic_name?: string
          currency?: string
          day_end?: number
          day_start?: number
          default_duration?: number
          default_package_validity?: number
          email?: string | null
          id?: boolean
          logo_url?: string | null
          low_sessions_threshold?: number
          phone?: string | null
          reminder_hours?: number[]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cancellation_hours?: number
          charge_late_cancel?: boolean
          charge_no_show?: boolean
          clinic_name?: string
          currency?: string
          day_end?: number
          day_start?: number
          default_duration?: number
          default_package_validity?: number
          email?: string | null
          id?: boolean
          logo_url?: string | null
          low_sessions_threshold?: number
          phone?: string | null
          reminder_hours?: number[]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          name: string
          receipt_url: string | null
          spent_on: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          name: string
          receipt_url?: string | null
          spent_on?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          name?: string
          receipt_url?: string | null
          spent_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: boolean
          created_at: string
          discount: number
          final_price: number
          id: string
          name: string
          price: number
          sessions: number
          validity_days: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount?: number
          final_price?: number
          id?: string
          name: string
          price?: number
          sessions: number
          validity_days?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          discount?: number
          final_price?: number
          id?: string
          name?: string
          price?: number
          sessions?: number
          validity_days?: number
        }
        Relationships: []
      }
      patient_packages: {
        Row: {
          active: boolean
          amount_paid: number
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          package_id: string | null
          patient_id: string
          price: number
          sessions_cancelled: number
          sessions_completed: number
          sessions_missed: number
          sessions_remaining: number | null
          start_date: string
          total_sessions: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          package_id?: string | null
          patient_id: string
          price?: number
          sessions_cancelled?: number
          sessions_completed?: number
          sessions_missed?: number
          sessions_remaining?: number | null
          start_date?: string
          total_sessions: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          package_id?: string | null
          patient_id?: string
          price?: number
          sessions_cancelled?: number
          sessions_completed?: number
          sessions_missed?: number
          sessions_remaining?: number | null
          start_date?: string
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean
          address: string | null
          alerts: string | null
          code: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          diagnosis: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          gender: string | null
          id: string
          medical_condition: string | null
          notes: string | null
          phone: string | null
          primary_therapist_id: string | null
          treatment_plan: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          alerts?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          gender?: string | null
          id?: string
          medical_condition?: string | null
          notes?: string | null
          phone?: string | null
          primary_therapist_id?: string | null
          treatment_plan?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          alerts?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          medical_condition?: string | null
          notes?: string | null
          phone?: string | null
          primary_therapist_id?: string | null
          treatment_plan?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_primary_therapist_id_fkey"
            columns: ["primary_therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          patient_id: string | null
          patient_package_id: string | null
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          patient_id?: string | null
          patient_package_id?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          patient_id?: string | null
          patient_package_id?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_package_id_fkey"
            columns: ["patient_package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      therapists: {
        Row: {
          active: boolean
          break_end: number | null
          break_start: number | null
          created_at: string
          email: string | null
          id: string
          initials: string
          name: string
          phone: string | null
          photo_url: string | null
          profile_id: string | null
          sort_order: number
          specialty: string | null
          updated_at: string
          work_end: number
          work_start: number
          working_days: number[]
        }
        Insert: {
          active?: boolean
          break_end?: number | null
          break_start?: number | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          sort_order?: number
          specialty?: string | null
          updated_at?: string
          work_end?: number
          work_start?: number
          working_days?: number[]
        }
        Update: {
          active?: boolean
          break_end?: number | null
          break_start?: number | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          sort_order?: number
          specialty?: string | null
          updated_at?: string
          work_end?: number
          work_start?: number
          working_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "therapists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_notes: {
        Row: {
          appointment_id: string | null
          author_id: string | null
          content: string
          created_at: string
          id: string
          patient_id: string
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          patient_id: string
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          patient_id?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          body: string
          created_at: string
          error: string | null
          id: string
          message_type: string
          patient_id: string | null
          provider_message_id: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["wa_status"]
          template_key: string | null
          to_number: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          body: string
          created_at?: string
          error?: string | null
          id?: string
          message_type?: string
          patient_id?: string | null
          provider_message_id?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["wa_status"]
          template_key?: string | null
          to_number: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          message_type?: string
          patient_id?: string | null
          provider_message_id?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["wa_status"]
          template_key?: string | null
          to_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          key: string
          language_code: string
          meta_template_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          key: string
          language_code?: string
          meta_template_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          key?: string
          language_code?: string
          meta_template_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_current_user: {
        Args: { _full_name: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_desk: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      my_therapist_id: { Args: never; Returns: string }
      patient_sessions: {
        Args: { _patient_id: string }
        Returns: {
          active: boolean
          end_date: string
          id: string
          name: string
          patient_id: string
          sessions_cancelled: number
          sessions_completed: number
          sessions_missed: number
          sessions_remaining: number
          start_date: string
          total_sessions: number
        }[]
      }
      recalc_patient_package: { Args: { _pkg_id: string }; Returns: undefined }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "receptionist" | "therapist"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      expense_category:
        | "salaries"
        | "rent"
        | "utilities"
        | "equipment"
        | "maintenance"
        | "marketing"
        | "supplies"
        | "software"
        | "other"
      payment_kind: "payment" | "refund" | "discount"
      payment_method:
        | "cash"
        | "visa"
        | "mastercard"
        | "bank_transfer"
        | "wallet"
        | "other"
      wa_status: "pending" | "sent" | "delivered" | "read" | "failed"
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
      app_role: ["admin", "receptionist", "therapist"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "checked_in",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      expense_category: [
        "salaries",
        "rent",
        "utilities",
        "equipment",
        "maintenance",
        "marketing",
        "supplies",
        "software",
        "other",
      ],
      payment_kind: ["payment", "refund", "discount"],
      payment_method: [
        "cash",
        "visa",
        "mastercard",
        "bank_transfer",
        "wallet",
        "other",
      ],
      wa_status: ["pending", "sent", "delivered", "read", "failed"],
    },
  },
} as const
