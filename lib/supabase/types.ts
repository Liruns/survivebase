// SurviveBase - Supabase Database Types

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          appid: number;
          name: string;
          description: string | null;
          header_image: string | null;
          screenshots: string[];
          price_initial: number;
          price_final: number;
          discount_percent: number;
          is_free: boolean;
          review_positive: number;
          review_negative: number;
          review_score: number;
          release_date: string | null;
          owners: string | null;
          playtime: number;
          singleplayer: boolean;
          multiplayer: boolean;
          coop: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          appid: number;
          name: string;
          description?: string | null;
          header_image?: string | null;
          screenshots?: string[];
          price_initial?: number;
          price_final?: number;
          discount_percent?: number;
          is_free?: boolean;
          review_positive?: number;
          review_negative?: number;
          review_score?: number;
          release_date?: string | null;
          owners?: string | null;
          playtime?: number;
          singleplayer?: boolean;
          multiplayer?: boolean;
          coop?: boolean;
          tags?: string[];
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['games']['Insert']>;
      };
    };
    Views: {
      games_on_sale: {
        Row: Database['public']['Tables']['games']['Row'];
      };
      games_top_rated: {
        Row: Database['public']['Tables']['games']['Row'];
      };
    };
    Functions: {
      upsert_games: {
        Args: { games_data: unknown };
        Returns: number;
      };
    };
  };
}

// Database row type
export type GameRow = Database['public']['Tables']['games']['Row'];
