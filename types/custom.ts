export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export interface SearchResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export type ActionState<T = void> = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
};
