export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface WordList {
  list_name: string;
}

export interface WordsState {
  wordLists: string[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  emailConfirmationSent: boolean;
  pendingEmail: string | null;
}

export interface AppState {
  auth: AuthState;
  words: WordsState;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  name?: string;
}
