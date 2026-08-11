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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      meal_plan_day_items: {
        Row: {
          meal_plan_day_id: string
          product_id: string
        }
        Insert: {
          meal_plan_day_id: string
          product_id: string
        }
        Update: {
          meal_plan_day_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_day_items_meal_plan_day_id_fkey"
            columns: ["meal_plan_day_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_day_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_days: {
        Row: {
          day_number: number
          description: string
          id: string
          meal_slot: string
          shopping_list_id: string
          title: string
        }
        Insert: {
          day_number: number
          description: string
          id?: string
          meal_slot: string
          shopping_list_id: string
          title: string
        }
        Update: {
          day_number?: number
          description?: string
          id?: string
          meal_slot?: string
          shopping_list_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_days_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          id: string
          price_cop: number
          product_id: string
          recorded_at: string
        }
        Insert: {
          id?: string
          price_cop: number
          product_id: string
          recorded_at?: string
        }
        Update: {
          id?: string
          price_cop?: number
          product_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          external_id: string
          first_seen_at: string
          food_group: string
          id: string
          in_stock: boolean
          last_seen_at: string
          name: string
          presentation: string | null
          price_cop: number
          store_id: string
        }
        Insert: {
          brand?: string | null
          category: string
          external_id: string
          first_seen_at?: string
          food_group: string
          id?: string
          in_stock?: boolean
          last_seen_at?: string
          name: string
          presentation?: string | null
          price_cop: number
          store_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          external_id?: string
          first_seen_at?: string
          food_group?: string
          id?: string
          in_stock?: boolean
          last_seen_at?: string
          name?: string
          presentation?: string | null
          price_cop?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          pages_fetched: number
          products_upserted: number
          started_at: string
          status: string
          store_id: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          pages_fetched?: number
          products_upserted?: number
          started_at?: string
          status?: string
          store_id: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          pages_fetched?: number
          products_upserted?: number
          started_at?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_runs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          checked: boolean
          checked_at: string | null
          id: string
          note: string | null
          product_id: string
          quantity: number
          shopping_list_id: string
          sort_order: number
        }
        Insert: {
          checked?: boolean
          checked_at?: string | null
          id?: string
          note?: string | null
          product_id: string
          quantity?: number
          shopping_list_id: string
          sort_order?: number
        }
        Update: {
          checked?: boolean
          checked_at?: string | null
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          shopping_list_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          batch_id: string
          budget_cop: number | null
          created_at: string
          excluded_terms: string[]
          id: string
          is_active: boolean
          label: string
          people: number
          source: string
          store_id: string
          total_cost_cop: number | null
          week_number: number
        }
        Insert: {
          batch_id?: string
          budget_cop?: number | null
          created_at?: string
          excluded_terms?: string[]
          id?: string
          is_active?: boolean
          label: string
          people?: number
          source: string
          store_id: string
          total_cost_cop?: number | null
          week_number?: number
        }
        Update: {
          batch_id?: string
          budget_cop?: number | null
          created_at?: string
          excluded_terms?: string[]
          id?: string
          is_active?: boolean
          label?: string
          people?: number
          source?: string
          store_id?: string
          total_cost_cop?: number | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          id: string
          slug: string
          source_path: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          id?: string
          slug: string
          source_path: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          id?: string
          slug?: string
          source_path?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          note: string | null
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at: string
          note?: string | null
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          note?: string | null
          weight_kg?: number
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
