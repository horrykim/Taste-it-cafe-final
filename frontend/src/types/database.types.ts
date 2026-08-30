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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_business_reports: {
        Row: {
          branch_id: string
          generated_at: string
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          report_content: string
        }
        Insert: {
          branch_id: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          report_content: string
        }
        Update: {
          branch_id?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          report_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_reports_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_business_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_inventory: {
        Row: {
          branch_id: string
          created_at: string
          current_quantity: number
          id: string
          inventory_item_id: string
          low_stock_threshold: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          current_quantity?: number
          id?: string
          inventory_item_id: string
          low_stock_threshold?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          current_quantity?: number
          id?: string
          inventory_item_id?: string
          low_stock_threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          code: string
          contact_number: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          code: string
          contact_number: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          code?: string
          contact_number?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      database_test_runs: {
        Row: {
          created_at: string
          details: string | null
          id: string
          passed: boolean
          test_name: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          passed: boolean
          test_name: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          passed?: boolean
          test_name?: string
        }
        Relationships: []
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          base_unit_id: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_unit_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_unit_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          inventory_item_id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          performed_by: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason: string | null
          reconciliation_id: string | null
          sale_id: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          inventory_item_id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          performed_by: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason?: string | null
          reconciliation_id?: string | null
          sale_id?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          performed_by?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reason?: string | null
          reconciliation_id?: string | null
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reconciliations: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          inventory_item_id: string
          other_reason: string | null
          performed_by: string
          physical_quantity: number
          reason_id: string | null
          system_quantity: number
          variance: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          inventory_item_id: string
          other_reason?: string | null
          performed_by: string
          physical_quantity: number
          reason_id?: string | null
          system_quantity: number
          variance: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string
          other_reason?: string | null
          performed_by?: string
          physical_quantity?: number
          reason_id?: string | null
          system_quantity?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reconciliations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reconciliations_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reconciliations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reconciliations_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          is_archived: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_archived?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_archived?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          related_inventory_item_id: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          related_inventory_item_id?: string | null
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          related_inventory_item_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_inventory_item_id_fkey"
            columns: ["related_inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean
          is_archived: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          employee_id?: string | null
          full_name: string
          id: string
          is_active?: boolean
          is_archived?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          quantity: number
          recipe_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          quantity: number
          recipe_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          quantity?: number
          recipe_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_archived: boolean
          menu_item_id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          menu_item_id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          menu_item_id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_reasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_archived: boolean
          label: string
          reason_type: Database["public"]["Enums"]["reconciliation_reason_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          label: string
          reason_type: Database["public"]["Enums"]["reconciliation_reason_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          label?: string
          reason_type?: Database["public"]["Enums"]["reconciliation_reason_type"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          branch_id: string
          created_at: string
          generated_by: string
          id: string
          period_end: string
          period_start: string
          report_type: Database["public"]["Enums"]["report_type"]
        }
        Insert: {
          branch_id: string
          created_at?: string
          generated_by: string
          id?: string
          period_end: string
          period_start: string
          report_type: Database["public"]["Enums"]["report_type"]
        }
        Update: {
          branch_id?: string
          created_at?: string
          generated_by?: string
          id?: string
          period_end?: string
          period_start?: string
          report_type?: Database["public"]["Enums"]["report_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          item_name_snapshot: string
          line_total: number
          menu_item_id: string
          quantity: number
          sale_id: string
          unit_price_snapshot: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name_snapshot: string
          line_total: number
          menu_item_id: string
          quantity: number
          sale_id: string
          unit_price_snapshot: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name_snapshot?: string
          line_total?: number
          menu_item_id?: string
          quantity?: number
          sale_id?: string
          unit_price_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string
          cash_received: number | null
          change_amount: number | null
          completed_at: string
          created_at: string
          gcash_reference: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          staff_id: string
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total: number
          transaction_number: string
        }
        Insert: {
          branch_id: string
          cash_received?: number | null
          change_amount?: number | null
          completed_at?: string
          created_at?: string
          gcash_reference?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          staff_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total: number
          transaction_number: string
        }
        Update: {
          branch_id?: string
          cash_received?: number | null
          change_amount?: number | null
          completed_at?: string
          created_at?: string
          gcash_reference?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          staff_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total?: number
          transaction_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_conversions: {
        Row: {
          conversion_factor: number
          created_at: string
          from_unit_id: string
          id: string
          to_unit_id: string
        }
        Insert: {
          conversion_factor: number
          created_at?: string
          from_unit_id: string
          id?: string
          to_unit_id: string
        }
        Update: {
          conversion_factor?: number
          created_at?: string
          from_unit_id?: string
          id?: string
          to_unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_conversions_from_unit_id_fkey"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversions_to_unit_id_fkey"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
          unit_type: Database["public"]["Enums"]["unit_type"]
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
          unit_type: Database["public"]["Enums"]["unit_type"]
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          low_stock_notifications: boolean
          notification_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          low_stock_notifications?: boolean
          notification_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          low_stock_notifications?: boolean
          notification_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_sale: {
        Args: {
          p_branch_id: string
          p_cash_received?: number
          p_gcash_reference?: string
          p_items: Json
          p_payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: Json
      }
      convert_quantity: {
        Args: { p_from_unit: string; p_quantity: number; p_to_unit: string }
        Returns: number
      }
      current_branch_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      perform_inventory_reconciliation: {
        Args: {
          p_branch_id: string
          p_inventory_item_id: string
          p_other_reason?: string
          p_physical_quantity: number
          p_reason_type: Database["public"]["Enums"]["reconciliation_reason_type"]
        }
        Returns: Json
      }
      run_database_verification: { Args: never; Returns: Json }
    }
    Enums: {
      inventory_movement_type: "sale" | "reconciliation"
      notification_severity: "info" | "warning" | "critical"
      notification_type: "low_stock" | "out_of_stock" | "system"
      payment_method: "cash" | "gcash"
      reconciliation_reason_type:
        | "damaged"
        | "expired"
        | "spillage"
        | "counting_error"
        | "other"
      report_type: "sales" | "inventory" | "menu" | "reconciliation" | "branch"
      sale_status: "completed"
      unit_type: "weight" | "volume" | "count"
      user_role: "owner" | "staff"
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
      inventory_movement_type: ["sale", "reconciliation"],
      notification_severity: ["info", "warning", "critical"],
      notification_type: ["low_stock", "out_of_stock", "system"],
      payment_method: ["cash", "gcash"],
      reconciliation_reason_type: [
        "damaged",
        "expired",
        "spillage",
        "counting_error",
        "other",
      ],
      report_type: ["sales", "inventory", "menu", "reconciliation", "branch"],
      sale_status: ["completed"],
      unit_type: ["weight", "volume", "count"],
      user_role: ["owner", "staff"],
    },
  },
} as const
