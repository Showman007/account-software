/** Authentication & User types */

export interface User {
  id: number;
  email: string;
  role: string;
  created_at?: string;
}
