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
      addresses: {
        Row: {
          city: string | null
          created_at: string | null
          geom: string | null
          id: string
          is_default: boolean | null
          label: string | null
          lat: number | null
          line1: string | null
          lng: number | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          geom?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          line1?: string | null
          lng?: number | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          geom?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          line1?: string | null
          lng?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          capacity: number | null
          created_at: string | null
          end_at: string
          id: string
          is_recurring: boolean | null
          pro_id: string
          rrule_text: string | null
          source: Database["public"]["Enums"]["slot_source"]
          start_at: string
          status: Database["public"]["Enums"]["slot_status"]
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          end_at: string
          id?: string
          is_recurring?: boolean | null
          pro_id: string
          rrule_text?: string | null
          source?: Database["public"]["Enums"]["slot_source"]
          start_at: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          end_at?: string
          id?: string
          is_recurring?: boolean | null
          pro_id?: string
          rrule_text?: string | null
          source?: Database["public"]["Enums"]["slot_source"]
          start_at?: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pro_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          at: string | null
          booking_id: string
          id: string
          meta: Json | null
          type: Database["public"]["Enums"]["booking_event_type"]
        }
        Insert: {
          at?: string | null
          booking_id: string
          id?: string
          meta?: Json | null
          type: Database["public"]["Enums"]["booking_event_type"]
        }
        Update: {
          at?: string | null
          booking_id?: string
          id?: string
          meta?: Json | null
          type?: Database["public"]["Enums"]["booking_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_id: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          geom: string | null
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          photos: string[] | null
          price_quote: number | null
          pro_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          geom?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          photos?: string[] | null
          price_quote?: number | null
          pro_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          geom?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          photos?: string[] | null
          price_quote?: number | null
          pro_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pro_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pro_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          media_url: string | null
          read_at: string | null
          sender_id: string
          text: string | null
          thread_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_url?: string | null
          read_at?: string | null
          sender_id: string
          text?: string | null
          thread_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_url?: string | null
          read_at?: string | null
          sender_id?: string
          text?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string | null
          details: string | null
          id: string
          opener_id: string
          reason: string | null
          resolution_note: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          opener_id: string
          reason?: string | null
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          opener_id?: string
          reason?: string | null
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opener_id_fkey"
            columns: ["opener_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          booking_id: string
          created_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          fee_app: number | null
          fee_psp: number | null
          id: string
          payout_id: string | null
          pro_id: string
          provider: string | null
          provider_payment_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          booking_id: string
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          fee_app?: number | null
          fee_psp?: number | null
          id?: string
          payout_id?: string | null
          pro_id: string
          provider?: string | null
          provider_payment_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          booking_id?: string
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          fee_app?: number | null
          fee_psp?: number | null
          id?: string
          payout_id?: string | null
          pro_id?: string
          provider?: string | null
          provider_payment_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pro_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          pro_id: string
          provider_payout_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          pro_id: string
          provider_payout_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          pro_id?: string
          provider_payout_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pro_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_profiles: {
        Row: {
          avg_price_hint: number | null
          base_city: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          estimated_arrival_time: number | null
          geom: string | null
          id: string
          insurance_provider: string | null
          is_available_now: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          service_radius_km: number | null
          updated_at: string | null
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avg_price_hint?: number | null
          base_city?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          estimated_arrival_time?: number | null
          geom?: string | null
          id?: string
          insurance_provider?: string | null
          is_available_now?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          service_radius_km?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avg_price_hint?: number | null
          base_city?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          estimated_arrival_time?: number | null
          geom?: string | null
          id?: string
          insurance_provider?: string | null
          is_available_now?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          service_radius_km?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pro_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_services: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_hours: number | null
          photos: string[] | null
          price: number | null
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          pro_id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          photos?: string[] | null
          price?: number | null
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          pro_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          photos?: string[] | null
          price?: number | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          pro_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_services_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pro_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_locations: {
        Row: {
          created_at: string
          heading: number | null
          id: string
          is_available: boolean
          is_online: boolean
          last_updated: string
          lat: number
          lng: number
          pro_id: string
          speed: number | null
        }
        Insert: {
          created_at?: string
          heading?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          last_updated?: string
          lat: number
          lng: number
          pro_id: string
          speed?: number | null
        }
        Update: {
          created_at?: string
          heading?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          last_updated?: string
          lat?: number
          lng?: number
          pro_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_locations_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pro_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          text: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          text?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_name: string | null
          password_hash: string | null
          phone: string | null
          photo_url: string | null
          rating_avg: number | null
          rating_count: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_name?: string | null
          password_hash?: string | null
          phone?: string | null
          photo_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_name?: string | null
          password_hash?: string | null
          phone?: string | null
          photo_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
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
      booking_event_type:
        | "created"
        | "paid"
        | "confirmed"
        | "rescheduled"
        | "canceled"
        | "completed"
        | "disputed"
        | "escrow_released"
        | "refunded"
      booking_status:
        | "pending"
        | "awaiting_payment"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "canceled"
        | "disputed"
      dispute_status:
        | "open"
        | "investigating"
        | "resolved"
        | "refunded"
        | "dismissed"
      escrow_status: "held" | "released" | "refunded"
      kyc_status: "pending" | "verified" | "rejected"
      pricing_type: "fixed" | "hourly"
      slot_source: "manual" | "booking" | "admin"
      slot_status: "open" | "blocked" | "booked"
      user_role: "user" | "pro" | "admin"
      verification_status: "pending" | "verified" | "rejected"
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
      booking_event_type: [
        "created",
        "paid",
        "confirmed",
        "rescheduled",
        "canceled",
        "completed",
        "disputed",
        "escrow_released",
        "refunded",
      ],
      booking_status: [
        "pending",
        "awaiting_payment",
        "confirmed",
        "in_progress",
        "completed",
        "canceled",
        "disputed",
      ],
      dispute_status: [
        "open",
        "investigating",
        "resolved",
        "refunded",
        "dismissed",
      ],
      escrow_status: ["held", "released", "refunded"],
      kyc_status: ["pending", "verified", "rejected"],
      pricing_type: ["fixed", "hourly"],
      slot_source: ["manual", "booking", "admin"],
      slot_status: ["open", "blocked", "booked"],
      user_role: ["user", "pro", "admin"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
