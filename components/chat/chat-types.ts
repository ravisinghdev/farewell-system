export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Reaction {
  message_id: string;
  user_id: string;
  reaction: string;
}

export interface Message {
  id: string;
  content: string | null;
  created_at: string | null;
  user_id: string | null;
  user: User | null;
  is_deleted?: boolean;
  edited_at?: string | null;
  reactions?: Reaction[];
  type?: "text" | "image" | "file" | "system";
  file_url?: string | null;
  reply_to_id?: string | null;
}
