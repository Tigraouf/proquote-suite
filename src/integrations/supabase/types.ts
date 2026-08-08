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
      clients: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_company: boolean
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_company?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_company?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      document_items: {
        Row: {
          created_at: string
          description: string
          document_id: string
          id: string
          position: number
          quantity: number
          unit: string
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          document_id: string
          id?: string
          position?: number
          quantity?: number
          unit?: string
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          document_id?: string
          id?: string
          position?: number
          quantity?: number
          unit?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          discount: number
          due_date: string | null
          id: string
          issue_date: string
          last_reminder_at: string | null
          notes: string | null
          number: string
          paid_at: string | null
          payment_terms: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number
          total: number
          type: Database["public"]["Enums"]["doc_type"]
          updated_at: string
          user_id: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          discount?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          last_reminder_at?: string | null
          notes?: string | null
          number: string
          paid_at?: string | null
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["doc_type"]
          updated_at?: string
          user_id: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          discount?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          last_reminder_at?: string | null
          notes?: string | null
          number?: string
          paid_at?: string | null
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["doc_type"]
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          document_id: string
          id: string
          method: string
          note: string | null
          paid_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          document_id: string
          id?: string
          method?: string
          note?: string | null
          paid_on?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          document_id?: string
          id?: string
          method?: string
          note?: string | null
          paid_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          iban: string | null
          id: string
          legal_form: string | null
          logo_url: string | null
          payment_terms_days: number
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          plan_cycle: Database["public"]["Enums"]["plan_cycle"]
          plan_renews_at: string | null
          postal_code: string | null
          siret: string | null
          trade: string | null
          updated_at: string
          vat_exempt: boolean
          vat_number: string | null
          vat_rate: number
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id: string
          legal_form?: string | null
          logo_url?: string | null
          payment_terms_days?: number
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_cycle?: Database["public"]["Enums"]["plan_cycle"]
          plan_renews_at?: string | null
          postal_code?: string | null
          siret?: string | null
          trade?: string | null
          updated_at?: string
          vat_exempt?: boolean
          vat_number?: string | null
          vat_rate?: number
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id?: string
          legal_form?: string | null
          logo_url?: string | null
          payment_terms_days?: number
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_cycle?: Database["public"]["Enums"]["plan_cycle"]
          plan_renews_at?: string | null
          postal_code?: string | null
          siret?: string | null
          trade?: string | null
          updated_at?: string
          vat_exempt?: boolean
          vat_number?: string | null
          vat_rate?: number
          website?: string | null
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
      doc_status:
        | "brouillon"
        | "envoye"
        | "accepte"
        | "refuse"
        | "paye"
        | "en_retard"
        | "annule"
      doc_type: "devis" | "facture"
      plan_cycle: "none" | "monthly" | "yearly"
      plan_type: "free" | "premium"
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
      doc_status: [
        "brouillon",
        "envoye",
        "accepte",
        "refuse",
        "paye",
        "en_retard",
        "annule",
      ],
      doc_type: ["devis", "facture"],
      plan_cycle: ["none", "monthly", "yearly"],
      plan_type: ["free", "premium"],
    },
  },
} as const
