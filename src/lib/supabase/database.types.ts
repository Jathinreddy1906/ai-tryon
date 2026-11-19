export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_path: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_path?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_path?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_styles: string[];
          preferred_colors: string[];
          preferred_categories: string[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_styles?: string[];
          preferred_colors?: string[];
          preferred_categories?: string[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_styles?: string[];
          preferred_colors?: string[];
          preferred_categories?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          brand: string;
          description: string;
          category_id: string;
          image_url: string;
          image_alt: string;
          colors: string[];
          available_sizes: string[];
          price_cents: number;
          currency_code: string;
          tags: string[];
          label: string;
          publication_status: "draft" | "published" | "archived";
          is_sample: boolean;
          try_on_eligible: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          brand: string;
          description: string;
          category_id: string;
          image_url: string;
          image_alt: string;
          colors?: string[];
          available_sizes?: string[];
          price_cents: number;
          currency_code?: string;
          tags?: string[];
          label?: string;
          publication_status?: "draft" | "published" | "archived";
          is_sample?: boolean;
          try_on_eligible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          brand?: string;
          description?: string;
          category_id?: string;
          image_url?: string;
          image_alt?: string;
          colors?: string[];
          available_sizes?: string[];
          price_cents?: number;
          currency_code?: string;
          tags?: string[];
          label?: string;
          publication_status?: "draft" | "published" | "archived";
          is_sample?: boolean;
          try_on_eligible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      person_photos: {
        Row: {
          id: string;
          user_id: string;
          object_path: string;
          content_type: "image/jpeg";
          byte_size: number;
          width: number;
          height: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          object_path: string;
          content_type: "image/jpeg";
          byte_size: number;
          width: number;
          height: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          object_path?: string;
          content_type?: "image/jpeg";
          byte_size?: number;
          width?: number;
          height?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      try_on_jobs: {
        Row: {
          id: string;
          user_id: string;
          product_slug: string;
          provider_prediction_id: string | null;
          status: "starting" | "in_queue" | "processing" | "completed" | "failed" | "expired";
          consent_version: string;
          consented_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_slug: string;
          provider_prediction_id?: string | null;
          status?: "starting" | "in_queue" | "processing" | "completed" | "failed" | "expired";
          consent_version: string;
          consented_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_slug?: string;
          provider_prediction_id?: string | null;
          status?: "starting" | "in_queue" | "processing" | "completed" | "failed" | "expired";
          consent_version?: string;
          consented_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_try_on_job: {
        Args: {
          p_user_id: string;
          p_product_slug: string;
          p_consent_version: string;
        };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
