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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: NonNullable<Json>
          space_id: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: NonNullable<Json>
          space_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: NonNullable<Json>
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          created_by: string
          icon: string | null
          id: string
          name: string
          space_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by: string
          icon?: string | null
          id?: string
          name: string
          space_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          icon?: string | null
          id?: string
          name?: string
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          event_id: string
          id: string
          space_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          event_id: string
          id?: string
          space_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          event_id?: string
          id?: string
          space_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_space_id_event_id_fkey'
            columns: ['space_id', 'event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['space_id', 'id']
          },
          {
            foreignKeyName: 'comments_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          person_id: string
          space_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          person_id: string
          space_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          person_id?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_participants_space_id_event_id_fkey'
            columns: ['space_id', 'event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['space_id', 'id']
          },
          {
            foreignKeyName: 'event_participants_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_participants_space_id_person_id_fkey'
            columns: ['space_id', 'person_id']
            isOneToOne: false
            referencedRelation: 'people'
            referencedColumns: ['space_id', 'id']
          },
        ]
      }
      events: {
        Row: {
          approximate_date_label: string | null
          category_id: string | null
          created_at: string
          created_by: string
          date_precision: Database['public']['Enums']['date_precision']
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_day: number | null
          end_month: number | null
          end_year: number | null
          id: string
          location_id: string | null
          moment_type: Database['public']['Enums']['moment_type']
          parent_event_id: string | null
          space_id: string
          start_day: number | null
          start_month: number | null
          start_year: number | null
          timeline_position: Database['public']['Enums']['timeline_position']
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          approximate_date_label?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          date_precision?: Database['public']['Enums']['date_precision']
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_day?: number | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          location_id?: string | null
          moment_type?: Database['public']['Enums']['moment_type']
          parent_event_id?: string | null
          space_id: string
          start_day?: number | null
          start_month?: number | null
          start_year?: number | null
          timeline_position?: Database['public']['Enums']['timeline_position']
          title: string
          updated_at?: string
        }
        Update: {
          approximate_date_label?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          date_precision?: Database['public']['Enums']['date_precision']
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_day?: number | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          location_id?: string | null
          moment_type?: Database['public']['Enums']['moment_type']
          parent_event_id?: string | null
          space_id?: string
          start_day?: number | null
          start_month?: number | null
          start_year?: number | null
          timeline_position?: Database['public']['Enums']['timeline_position']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_space_id_category_id_fkey'
            columns: ['space_id', 'category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['space_id', 'id']
          },
          {
            foreignKeyName: 'events_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_space_id_location_id_fkey'
            columns: ['space_id', 'location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['space_id', 'id']
          },
          {
            foreignKeyName: 'events_space_id_parent_event_id_fkey'
            columns: ['space_id', 'parent_event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['space_id', 'id']
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database['public']['Enums']['space_role']
          space_id: string
          status: Database['public']['Enums']['invitation_status']
          token_hash: string
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database['public']['Enums']['space_role']
          space_id: string
          status?: Database['public']['Enums']['invitation_status']
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database['public']['Enums']['space_role']
          space_id?: string
          status?: Database['public']['Enums']['invitation_status']
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      locations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          space_id: string
          state: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          space_id: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          space_id?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'locations_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          event_id: string
          file_size_bytes: number
          height: number | null
          id: string
          media_type: Database['public']['Enums']['media_kind']
          mime_type: string
          original_filename: string
          space_id: string
          storage_path: string
          taken_at: string | null
          updated_at: string
          uploaded_by: string
          width: number | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          event_id: string
          file_size_bytes: number
          height?: number | null
          id?: string
          media_type: Database['public']['Enums']['media_kind']
          mime_type: string
          original_filename: string
          space_id: string
          storage_path: string
          taken_at?: string | null
          updated_at?: string
          uploaded_by: string
          width?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          event_id?: string
          file_size_bytes?: number
          height?: number | null
          id?: string
          media_type?: Database['public']['Enums']['media_kind']
          mime_type?: string
          original_filename?: string
          space_id?: string
          storage_path?: string
          taken_at?: string | null
          updated_at?: string
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'media_space_id_event_id_fkey'
            columns: ['space_id', 'event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['space_id', 'id']
          },
          {
            foreignKeyName: 'media_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      memories: {
        Row: {
          content: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          event_id: string
          id: string
          space_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          content: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          event_id: string
          id?: string
          space_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          event_id?: string
          id?: string
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memories_space_id_event_id_fkey'
            columns: ['space_id', 'event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['space_id', 'id']
          },
          {
            foreignKeyName: 'memories_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      people: {
        Row: {
          avatar_storage_path: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          nickname: string | null
          space_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_storage_path?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          nickname?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          avatar_storage_path?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          nickname?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'people_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_storage_path: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_storage_path?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_storage_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          id: string
          joined_at: string
          role: Database['public']['Enums']['space_role']
          space_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          id?: string
          joined_at?: string
          role: Database['public']['Enums']['space_role']
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database['public']['Enums']['space_role']
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'space_members_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
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
      [_ in never]: never
    }
    Enums: {
      date_precision: 'day' | 'month' | 'year' | 'range' | 'unknown'
      invitation_status: 'pending' | 'accepted' | 'revoked' | 'expired'
      media_kind: 'photo' | 'video'
      moment_type: 'family' | 'individual' | 'other'
      space_role: 'admin' | 'contributor' | 'viewer'
      timeline_position: 'above' | 'below' | 'auto'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      date_precision: ['day', 'month', 'year', 'range', 'unknown'],
      invitation_status: ['pending', 'accepted', 'revoked', 'expired'],
      media_kind: ['photo', 'video'],
      moment_type: ['family', 'individual', 'other'],
      space_role: ['admin', 'contributor', 'viewer'],
      timeline_position: ['above', 'below', 'auto'],
    },
  },
} as const
