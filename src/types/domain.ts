export type UserRole = 'admin' | 'logista' | 'motoboy';
export type UserStatus = 'pendente' | 'ativo' | 'bloqueado';
export type DeliveryStatus =
  | 'aguardando'
  | 'aceita'
  | 'coletada'
  | 'em_transito'
  | 'entregue'
  | 'expirada'
  | 'cancelada';

export interface DomainUser {
  id: string;
  auth_id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreProfile {
  id: string;
  user_id: string;
  name: string;
  owner_name: string;
  address: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourierProfile {
  id: string;
  user_id: string;
  full_name: string;
  bike_photo_url: string | null;
  license_photo_url: string | null;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryRequest {
  id: string;
  store_id: string;
  destination_address: string | null;
  notes: string | null;
  status: DeliveryStatus;
  courier_id: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  collected_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  updated_at: string;
}

export interface AdminUserListItem extends DomainUser {
  store_name: string | null;
}

export interface AdminStoreProfile {
  id: string;
  user_id: string;
  name: string;
  owner_name: string;
  address: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCourierProfile {
  id: string;
  user_id: string;
  full_name: string;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserDetail {
  user: DomainUser;
  profile: AdminStoreProfile | AdminCourierProfile | null;
}

export interface AdminInsightsPendingUser {
  id: string;
  role: 'logista' | 'motoboy';
  status: 'pendente';
  created_at: string;
}

export interface AdminInsights {
  generated_at: string;
  user_counts: Record<UserRole, Record<UserStatus, number>>;
  delivery_counts_by_status: Record<DeliveryStatus, number>;
  payment_counts: {
    paid: number;
    pending: number;
  };
  active_accounts: {
    stores: number;
    couriers: number;
  };
  latest_pending_users: {
    limit: number;
    items: AdminInsightsPendingUser[];
  };
}

export interface AuthContext {
  authUserId: string;
  user: DomainUser;
}
