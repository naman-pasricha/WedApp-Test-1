// Database types generated from Supabase schema
// Generated manually based on migrations - run `npm run db:generate` when Supabase is available

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      weddings: {
        Row: {
          id: string
          slug: string
          host_id: string | null
          name: string
          date: string
          timezone: string
          theme: Json
          hero_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          host_id?: string | null
          name: string
          date: string
          timezone?: string
          theme?: Json
          hero_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          host_id?: string | null
          name?: string
          date?: string
          timezone?: string
          theme?: Json
          hero_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weddings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wedding_hosts: {
        Row: {
          wedding_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          wedding_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          wedding_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_hosts_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          wedding_id: string
          title: string
          description: string | null
          starts_at: string
          ends_at: string | null
          venue_name: string | null
          venue_address: string | null
          venue_lat: number | null
          venue_lng: number | null
          dress_code: string | null
          illustration_url: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          description?: string | null
          starts_at: string
          ends_at?: string | null
          venue_name?: string | null
          venue_address?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          dress_code?: string | null
          illustration_url?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          title?: string
          description?: string | null
          starts_at?: string
          ends_at?: string | null
          venue_name?: string | null
          venue_address?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          dress_code?: string | null
          illustration_url?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          }
        ]
      }
      guests: {
        Row: {
          id: string
          wedding_id: string
          name: string
          phone: string | null
          device_id: string
          session_token: string
          table_id: string | null
          joined_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          phone?: string | null
          device_id: string
          session_token: string
          table_id?: string | null
          joined_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          name?: string
          phone?: string | null
          device_id?: string
          session_token?: string
          table_id?: string | null
          joined_at?: string
          last_seen_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guests_table"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          wedding_id: string
          title: string
          body: string | null
          sent_by: string | null
          send_push: boolean
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          body?: string | null
          sent_by?: string | null
          send_push?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          title?: string
          body?: string | null
          sent_by?: string | null
          send_push?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          guest_id: string
          read_at: string
        }
        Insert: {
          announcement_id: string
          guest_id: string
          read_at?: string
        }
        Update: {
          announcement_id?: string
          guest_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      photos: {
        Row: {
          id: string
          wedding_id: string
          guest_id: string | null
          storage_path: string
          thumbnail_path: string | null
          mime_type: string
          width: number | null
          height: number | null
          file_size: number | null
          caption: string | null
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          guest_id?: string | null
          storage_path: string
          thumbnail_path?: string | null
          mime_type: string
          width?: number | null
          height?: number | null
          file_size?: number | null
          caption?: string | null
          is_hidden?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          guest_id?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          mime_type?: string
          width?: number | null
          height?: number | null
          file_size?: number | null
          caption?: string | null
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      photo_likes: {
        Row: {
          photo_id: string
          guest_id: string
          created_at: string
        }
        Insert: {
          photo_id: string
          guest_id: string
          created_at?: string
        }
        Update: {
          photo_id?: string
          guest_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_likes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          wedding_id: string
          guest_id: string | null
          host_user_id: string | null
          content: string
          message_type: 'text' | 'image' | 'system'
          image_url: string | null
          is_broadcast: boolean
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          guest_id?: string | null
          host_user_id?: string | null
          content: string
          message_type?: 'text' | 'image' | 'system'
          image_url?: string | null
          is_broadcast?: boolean
          is_hidden?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          guest_id?: string | null
          host_user_id?: string | null
          content?: string
          message_type?: 'text' | 'image' | 'system'
          image_url?: string | null
          is_broadcast?: boolean
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tables: {
        Row: {
          id: string
          wedding_id: string
          name: string
          capacity: number
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          capacity?: number
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          name?: string
          capacity?: number
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          id: string
          wedding_id: string
          type: string
          title: string
          description: string | null
          instructions: string | null
          points: number
          starts_at: string
          ends_at: string
          status: string
          display_order: number
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          type: string
          title: string
          description?: string | null
          instructions?: string | null
          points?: number
          starts_at: string
          ends_at: string
          status?: string
          display_order?: number
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          type?: string
          title?: string
          description?: string | null
          instructions?: string | null
          points?: number
          starts_at?: string
          ends_at?: string
          status?: string
          display_order?: number
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          }
        ]
      }
      challenge_completions: {
        Row: {
          id: string
          challenge_id: string
          guest_id: string
          photo_id: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          guest_id: string
          photo_id?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          guest_id?: string
          photo_id?: string | null
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          }
        ]
      },
      challenge_participations: {
        Row: {
          id: string
          challenge_id: string
          guest_id: string
          guest_name: string
          answers: Json
          score: number
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          guest_id: string
          guest_name: string
          answers: Json
          score?: number
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          guest_id?: string
          guest_name?: string
          answers?: Json
          score?: number
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      info_sections: {
        Row: {
          id: string
          wedding_id: string
          title: string
          content: string
          icon: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          title: string
          content: string
          icon?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          title?: string
          content?: string
          icon?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "info_sections_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          wedding_id: string
          guest_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          guest_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          guest_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_wedding_by_slug: {
        Args: { p_slug: string }
        Returns: {
          id: string
          slug: string
          name: string
          date: string
          timezone: string
          theme: Json
          hero_image_url: string | null
        }[]
      }
      get_wedding_for_guest: {
        Args: { p_slug: string }
        Returns: Json
      }
      join_wedding: {
        Args: {
          p_wedding_id: string
          p_name: string
          p_phone: string
          p_device_id: string
        }
        Returns: {
          id: string
          session_token: string
          table_id: string | null
        }[]
      }
      update_guest_last_seen: {
        Args: { p_guest_id: string }
        Returns: void
      }
      get_guest_by_token: {
        Args: { p_token: string }
        Returns: {
          id: string
          wedding_id: string
          name: string
          phone: string
          device_id: string
          table_id: string | null
        }[]
      }
      mark_announcement_read: {
        Args: { p_announcement_id: string; p_guest_id: string }
        Returns: void
      }
      get_announcement_read_count: {
        Args: { p_announcement_id: string }
        Returns: number
      }
      toggle_photo_like: {
        Args: { p_photo_id: string; p_guest_id: string }
        Returns: boolean
      }
      get_photo_like_count: {
        Args: { p_photo_id: string }
        Returns: number
      }
      guest_liked_photo: {
        Args: { p_photo_id: string; p_guest_id: string }
        Returns: boolean
      }
      complete_challenge: {
        Args: {
          p_challenge_id: string
          p_guest_id: string
          p_photo_id?: string | null
        }
        Returns: {
          id: string
          completed_at: string
        }[]
      }
      get_guest_completions: {
        Args: { p_guest_id: string }
        Returns: {
          challenge_id: string
          completed_at: string
        }[]
      }
      get_wedding_leaderboard: {
        Args: { p_wedding_id: string }
        Returns: {
          guest_id: string
          guest_name: string
          total_points: number
          completed_count: number
        }[]
      }
      get_wedding_stats: {
        Args: { p_wedding_id: string }
        Returns: Json
      }
      generate_qr_code: {
        Args: { p_url: string; p_size?: number }
        Returns: string
      }
      current_wedding_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      current_guest_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      current_host_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      is_wedding_host: {
        Args: { wedding_uuid: string }
        Returns: boolean
      }
      is_wedding_owner: {
        Args: { wedding_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      message_type: 'text' | 'image' | 'system'
      wedding_host_role: 'owner' | 'planner'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}