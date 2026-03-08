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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          priority: string
          property_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: string
          property_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: string
          property_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          new_data: Json | null
          old_data: Json | null
          property_id: string | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          property_id?: string | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          property_id?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          property_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          property_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          property_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          property_id: string
          resolution_notes: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          property_id: string
          resolution_notes?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string
          resolution_notes?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          property_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          property_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_menus: {
        Row: {
          breakfast: string | null
          created_at: string
          dinner: string | null
          id: string
          lunch: string | null
          menu_date: string
          property_id: string
          snacks: string | null
          updated_at: string
        }
        Insert: {
          breakfast?: string | null
          created_at?: string
          dinner?: string | null
          id?: string
          lunch?: string | null
          menu_date?: string
          property_id: string
          snacks?: string | null
          updated_at?: string
        }
        Update: {
          breakfast?: string | null
          created_at?: string
          dinner?: string | null
          id?: string
          lunch?: string | null
          menu_date?: string
          property_id?: string
          snacks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_menus_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_info: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          property_id: string
          qr_code_url: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          property_id: string
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          property_id?: string
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_info_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          city: string
          contact_phone: string | null
          created_at: string
          description: string | null
          gender_preference: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          locality: string | null
          name: string
          owner_id: string
          rules: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          address?: string
          amenities?: string[] | null
          city?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          gender_preference?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          locality?: string | null
          name: string
          owner_id: string
          rules?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          gender_preference?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          locality?: string | null
          name?: string
          owner_id?: string
          rules?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      property_enquiries: {
        Row: {
          created_at: string
          id: string
          message: string | null
          property_id: string
          status: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          property_id: string
          status?: string
          visitor_email?: string | null
          visitor_name: string
          visitor_phone: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          property_id?: string
          status?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_enquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          is_cover: boolean
          property_id: string
          storage_path: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          property_id: string
          storage_path: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          property_id?: string
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          created_at: string
          id: string
          is_anonymous: boolean
          property_id: string
          rating: number
          review_text: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          property_id: string
          rating: number
          review_text?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          property_id?: string
          rating?: number
          review_text?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          reward_granted: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          reward_granted?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          reward_granted?: boolean
          status?: string
        }
        Relationships: []
      }
      rent_history: {
        Row: {
          assignment_id: string
          changed_at: string
          changed_by: string
          id: string
          new_rent: number
          notes: string | null
          old_rent: number | null
        }
        Insert: {
          assignment_id: string
          changed_at?: string
          changed_by: string
          id?: string
          new_rent: number
          notes?: string | null
          old_rent?: number | null
        }
        Update: {
          assignment_id?: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_rent?: number
          notes?: string | null
          old_rent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_history_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "tenant_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: string
          payment_date: string | null
          proof_uploaded_at: string | null
          proof_url: string | null
          property_id: string
          room_id: string
          status: string
          tenant_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month: string
          payment_date?: string | null
          proof_uploaded_at?: string | null
          proof_url?: string | null
          property_id: string
          room_id: string
          status?: string
          tenant_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          payment_date?: string | null
          proof_uploaded_at?: string | null
          proof_url?: string | null
          property_id?: string
          room_id?: string
          status?: string
          tenant_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string
          deposit_amount: number | null
          description: string | null
          id: string
          is_vacant: boolean | null
          property_id: string
          rent_amount: number
          room_number: string
          room_type: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          id?: string
          is_vacant?: boolean | null
          property_id: string
          rent_amount?: number
          room_number: string
          room_type?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          id?: string
          is_vacant?: boolean | null
          property_id?: string
          rent_amount?: number
          room_number?: string
          room_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          razorpay_monthly_plan_id: string | null
          razorpay_yearly_plan_id: string | null
          slug: string
          tenant_limit: number
          yearly_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          razorpay_monthly_plan_id?: string | null
          razorpay_yearly_plan_id?: string | null
          slug: string
          tenant_limit?: number
          yearly_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          razorpay_monthly_plan_id?: string | null
          razorpay_yearly_plan_id?: string | null
          slug?: string
          tenant_limit?: number
          yearly_price?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_assignments: {
        Row: {
          created_at: string
          custom_rent: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          id_proof_number: string | null
          id_proof_type: string | null
          is_active: boolean | null
          move_in_date: string
          move_out_date: string | null
          notes: string | null
          property_id: string
          room_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          custom_rent?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          is_active?: boolean | null
          move_in_date?: string
          move_out_date?: string | null
          notes?: string | null
          property_id: string
          room_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          custom_rent?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          is_active?: boolean | null
          move_in_date?: string
          move_out_date?: string | null
          notes?: string | null
          property_id?: string
          room_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          id: string
          notes: string | null
          property_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          tenant_id: string
          url: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type?: string
          id?: string
          notes?: string | null
          property_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          tenant_id: string
          url: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          id?: string
          notes?: string | null
          property_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          claimed_by: string | null
          created_at: string
          expires_at: string
          id: string
          invite_code: string
          property_id: string
          room_id: string
          status: string
          tenant_email: string | null
          tenant_name: string | null
          tenant_phone: string | null
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_code?: string
          property_id: string
          room_id: string
          status?: string
          tenant_email?: string | null
          tenant_name?: string | null
          tenant_phone?: string | null
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_code?: string
          property_id?: string
          room_id?: string
          status?: string
          tenant_email?: string | null
          tenant_name?: string | null
          tenant_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
      utility_bills: {
        Row: {
          amount: number
          bill_month: string
          bill_type: string
          created_at: string
          current_reading: number | null
          id: string
          previous_reading: number | null
          proof_uploaded_at: string | null
          proof_url: string | null
          property_id: string
          rate_per_unit: number
          room_id: string
          status: string
          tenant_id: string
          units_consumed: number | null
        }
        Insert: {
          amount?: number
          bill_month: string
          bill_type?: string
          created_at?: string
          current_reading?: number | null
          id?: string
          previous_reading?: number | null
          proof_uploaded_at?: string | null
          proof_url?: string | null
          property_id: string
          rate_per_unit?: number
          room_id: string
          status?: string
          tenant_id: string
          units_consumed?: number | null
        }
        Update: {
          amount?: number
          bill_month?: string
          bill_type?: string
          created_at?: string
          current_reading?: number | null
          id?: string
          previous_reading?: number | null
          proof_uploaded_at?: string | null
          proof_url?: string | null
          property_id?: string
          rate_per_unit?: number
          room_id?: string
          status?: string
          tenant_id?: string
          units_consumed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_bills_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancy_notices: {
        Row: {
          created_at: string
          expected_move_out: string
          id: string
          notice_date: string
          property_id: string
          reason: string | null
          room_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          expected_move_out: string
          id?: string
          notice_date?: string
          property_id: string
          reason?: string | null
          room_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          expected_move_out?: string
          id?: string
          notice_date?: string
          property_id?: string
          reason?: string | null
          room_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_notices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_notices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_logs: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          created_by: string
          id: string
          notes: string | null
          property_id: string
          purpose: string
          tenant_id: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          property_id: string
          purpose?: string
          tenant_id?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          property_id?: string
          purpose?: string
          tenant_id?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_user_by_email: {
        Args: { _email: string }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _description: string
          _new_data?: Json
          _old_data?: Json
          _property_id: string
          _record_id: string
          _table_name: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "tenant"
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
      app_role: ["owner", "tenant"],
    },
  },
} as const
