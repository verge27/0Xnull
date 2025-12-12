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
      api_call_logs: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          function_name: string
          id: string
          method: string
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          function_name: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          function_name?: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: []
      }
      coins: {
        Row: {
          id: string
          image: string | null
          maximum: number
          memo: boolean
          minimum: number
          name: string
          network: string
          ticker: string
          updated_at: string
        }
        Insert: {
          id?: string
          image?: string | null
          maximum: number
          memo?: boolean
          minimum: number
          name: string
          network: string
          ticker: string
          updated_at?: string
        }
        Update: {
          id?: string
          image?: string | null
          maximum?: number
          memo?: boolean
          minimum?: number
          name?: string
          network?: string
          ticker?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          private_key_user_id: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          private_key_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          private_key_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_private_key_user_id_fkey"
            columns: ["private_key_user_id"]
            isOneToOne: false
            referencedRelation: "private_key_users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          currency_pair: string
          id: string
          rate: number
          updated_at: string
        }
        Insert: {
          currency_pair: string
          id?: string
          rate: number
          updated_at?: string
        }
        Update: {
          currency_pair?: string
          id?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category: string
          condition: string
          created_at: string
          description: string
          id: string
          images: string[] | null
          price_usd: number
          seller_id: string
          shipping_price_usd: number
          status: string
          stock: number
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          category: string
          condition?: string
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          price_usd: number
          seller_id: string
          shipping_price_usd?: number
          status?: string
          stock?: number
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          price_usd?: number
          seller_id?: string
          shipping_price_usd?: number
          status?: string
          stock?: number
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_private_key_user_id: string | null
          sender_user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_private_key_user_id?: string | null
          sender_user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_private_key_user_id?: string | null
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_private_key_user_id_fkey"
            columns: ["sender_private_key_user_id"]
            isOneToOne: false
            referencedRelation: "private_key_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_pk_user_id: string | null
          buyer_user_id: string | null
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          listing_id: string | null
          notes: string | null
          paid_at: string | null
          quantity: number
          seller_pk_user_id: string | null
          seller_user_id: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_price_usd: number
          status: string
          total_price_usd: number
          tracking_number: string | null
          unit_price_usd: number
          updated_at: string
        }
        Insert: {
          buyer_pk_user_id?: string | null
          buyer_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          paid_at?: string | null
          quantity?: number
          seller_pk_user_id?: string | null
          seller_user_id?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_price_usd?: number
          status?: string
          total_price_usd: number
          tracking_number?: string | null
          unit_price_usd: number
          updated_at?: string
        }
        Update: {
          buyer_pk_user_id?: string | null
          buyer_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          paid_at?: string | null
          quantity?: number
          seller_pk_user_id?: string | null
          seller_user_id?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_price_usd?: number
          status?: string
          total_price_usd?: number
          tracking_number?: string | null
          unit_price_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_pk_user_id_fkey"
            columns: ["buyer_pk_user_id"]
            isOneToOne: false
            referencedRelation: "private_key_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_pk_user_id_fkey"
            columns: ["seller_pk_user_id"]
            isOneToOne: false
            referencedRelation: "private_key_users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_key_users: {
        Row: {
          created_at: string
          display_name: string
          id: string
          payment_token: string | null
          pgp_encrypted_private_key: string | null
          pgp_public_key: string | null
          public_key: string
          reputation_score: number | null
          total_trades: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          payment_token?: string | null
          pgp_encrypted_private_key?: string | null
          pgp_public_key?: string | null
          public_key: string
          reputation_score?: number | null
          total_trades?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          payment_token?: string | null
          pgp_encrypted_private_key?: string | null
          pgp_public_key?: string | null
          public_key?: string
          reputation_score?: number | null
          total_trades?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          payment_token: string | null
          pgp_encrypted_private_key: string | null
          pgp_public_key: string | null
          reputation_score: number | null
          total_reviews: number | null
          updated_at: string
          xmr_address: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          payment_token?: string | null
          pgp_encrypted_private_key?: string | null
          pgp_public_key?: string | null
          reputation_score?: number | null
          total_reviews?: number | null
          updated_at?: string
          xmr_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          payment_token?: string | null
          pgp_encrypted_private_key?: string | null
          pgp_public_key?: string | null
          reputation_score?: number | null
          total_reviews?: number | null
          updated_at?: string
          xmr_address?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          reviewer_pk_user_id: string | null
          reviewer_user_id: string | null
          seller_pk_user_id: string | null
          seller_user_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          reviewer_pk_user_id?: string | null
          reviewer_user_id?: string | null
          seller_pk_user_id?: string | null
          seller_user_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          reviewer_pk_user_id?: string | null
          reviewer_user_id?: string | null
          seller_pk_user_id?: string | null
          seller_user_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_pk_user_id_fkey"
            columns: ["reviewer_pk_user_id"]
            isOneToOne: false
            referencedRelation: "private_key_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_seller_pk_user_id_fkey"
            columns: ["seller_pk_user_id"]
            isOneToOne: false
            referencedRelation: "private_key_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rpc_rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      swap_history: {
        Row: {
          amount: string
          created_at: string
          from_coin: string
          from_network: string
          id: string
          provider: string
          provider_address: string
          provider_memo: string | null
          receive_address: string
          status: string | null
          to_coin: string
          to_network: string
          trade_id: string
          user_id: string | null
        }
        Insert: {
          amount: string
          created_at?: string
          from_coin: string
          from_network: string
          id?: string
          provider: string
          provider_address: string
          provider_memo?: string | null
          receive_address: string
          status?: string | null
          to_coin: string
          to_network: string
          trade_id: string
          user_id?: string | null
        }
        Update: {
          amount?: string
          created_at?: string
          from_coin?: string
          from_network?: string
          id?: string
          provider?: string
          provider_address?: string
          provider_memo?: string | null
          receive_address?: string
          status?: string | null
          to_coin?: string
          to_network?: string
          trade_id?: string
          user_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      get_swap_by_trade_id: {
        Args: { p_trade_id: string }
        Returns: {
          amount: string
          created_at: string
          from_coin: string
          from_network: string
          id: string
          provider: string
          provider_address: string
          provider_memo: string | null
          receive_address: string
          status: string | null
          to_coin: string
          to_network: string
          trade_id: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "swap_history"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_swap_by_trade_id_limited: {
        Args: { p_client_ip?: string; p_trade_id: string }
        Returns: {
          amount: string
          created_at: string
          from_coin: string
          from_network: string
          id: string
          provider: string
          provider_address: string
          provider_memo: string | null
          receive_address: string
          status: string | null
          to_coin: string
          to_network: string
          trade_id: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "swap_history"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: {
        Args: { listing_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: {
          _conversation_id: string
          _private_key_user_id?: string
          _user_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
