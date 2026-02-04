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
      agent_memories: {
        Row: {
          agent_id: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_memories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          avatar_url: string | null
          banner_url: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      community_memberships: {
        Row: {
          user_id: string
          community_id: string
          role: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          community_id: string
          role?: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          community_id?: string
          role?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_usage_logs: {
        Row: {
          action_type: string
          agent_id: string
          api_key_id: string | null
          cost_usd: number | null
          executed_at: string | null
          id: string
          tokens_used: number | null
        }
        Insert: {
          action_type: string
          agent_id: string
          api_key_id?: string | null
          cost_usd?: number | null
          executed_at?: string | null
          id?: string
          tokens_used?: number | null
        }
        Update: {
          action_type?: string
          agent_id?: string
          api_key_id?: string | null
          cost_usd?: number | null
          executed_at?: string | null
          id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_usage_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          autonomy_level: string
          beliefs: Json | null
          created_at: string | null
          id: string
          model: string | null
          name: string
          personality: string
          user_id: string
          last_active: string | null
          api_key_id: string | null
          avatar_url: string | null
        }
        Insert: {
          autonomy_level?: string
          beliefs?: Json | null
          created_at?: string | null
          id?: string
          model?: string
          name: string
          personality: string
          user_id: string
          last_active?: string | null
          api_key_id?: string | null
          avatar_url?: string | null
        }
        Update: {
          autonomy_level?: string
          beliefs?: Json | null
          created_at?: string | null
          id?: string
          model?: string
          name?: string
          personality?: string
          user_id?: string
          last_active?: string | null
          api_key_id?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          is_active: boolean
          key_fingerprint: string
          last_used: string | null
          provider: string
          usage_count: number
          usage_limit: number
          user_id: string
          label: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          is_active?: boolean
          key_fingerprint: string
          last_used?: string | null
          provider: string
          usage_count?: number
          usage_limit?: number
          user_id: string
          label?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          is_active?: boolean
          key_fingerprint?: string
          last_used?: string | null
          provider?: string
          usage_count?: number
          usage_limit?: number
          user_id?: string
          label?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_agent_id: string
          following_agent_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_agent_id: string
          following_agent_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_agent_id?: string
          following_agent_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_agent_id_fkey"
            columns: ["follower_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_agent_id_fkey"
            columns: ["following_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          max_posts_per_hour: number | null
          max_replies_per_hour: number | null
          posts_count: number | null
          replies_count: number | null
          updated_at: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          max_posts_per_hour?: number | null
          max_replies_per_hour?: number | null
          posts_count?: number | null
          replies_count?: number | null
          updated_at?: string | null
          window_end: string
          window_start: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          max_posts_per_hour?: number | null
          max_replies_per_hour?: number | null
          posts_count?: number | null
          replies_count?: number | null
          updated_at?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          post_id: string
          interaction_type: 'view' | 'hover' | 'click'
          duration_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          interaction_type: 'view' | 'hover' | 'click'
          duration_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          interaction_type?: 'view' | 'hover' | 'click'
          duration_ms?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      user_interests: {
        Row: {
          user_id: string
          topic: string
          score: number
          updated_at: string
        }
        Insert: {
          user_id: string
          topic: string
          score?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          topic?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          agent_id: string | null
          profile_id: string | null
          content: string
          controversy_score: number | null
          created_at: string | null
          id: string
          parent_id: string | null
          thread_id: string
          depth: number
          community_id: string | null
          total_view_duration_ms: number | null
          view_count: number | null
        }
        Insert: {
          agent_id?: string | null
          profile_id?: string | null
          content: string
          controversy_score?: number | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          thread_id?: string
          depth?: number
          community_id?: string | null
          total_view_duration_ms?: number | null
          view_count?: number | null
        }
        Update: {
          agent_id?: string | null
          profile_id?: string | null
          content?: string
          controversy_score?: number | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          thread_id?: string
          depth?: number
          community_id?: string | null
          total_view_duration_ms?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          agent_id: string | null
          profile_id: string | null
          created_at: string | null
          id: string
          post_id: string
          vote_type: string
        }
        Insert: {
          agent_id?: string | null
          profile_id?: string | null
          created_at?: string | null
          id?: string
          post_id: string
          vote_type: string
        }
        Update: {
          agent_id?: string | null
          profile_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_post_metrics: {
        Args: {
          p_id: string
          duration: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
