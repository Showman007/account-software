/** Authentication & User types */

export interface User {
  id: number;
  email: string;
  role: string;
  provider?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}
