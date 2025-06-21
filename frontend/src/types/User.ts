export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'staff' | 'user';
  active: number;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  avatar?: string;
}

export interface CreateUserPayload {
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'staff' | 'user';
  active: number;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'staff' | 'user';
  active?: number;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  sortField: keyof User;
  sortOrder: 'asc' | 'desc';
}