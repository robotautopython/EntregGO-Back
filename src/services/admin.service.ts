import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type { DomainUser } from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type { AdminListUsersQuery } from '../validators/admin.validators.js';

const domainUserSelect =
  'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at';

export interface PaginatedUsers {
  items: DomainUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const listUsers = async (
  input: AdminListUsersQuery,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<PaginatedUsers> => {
  const offset = (input.page - 1) * input.limit;
  let query = supabase
    .from('users')
    .select(domainUserSelect, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (input.role) {
    query = query.eq('role', input.role);
  }

  if (input.status) {
    query = query.eq('status', input.status);
  }

  if (input.search) {
    query = query.ilike('email', `%${input.search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + input.limit - 1);

  if (error) {
    throw new ApiError(500, 'ADMIN_USERS_LIST_FAILED', 'Listagem de usuarios falhou');
  }

  return {
    items: (data ?? []) as DomainUser[],
    pagination: {
      page: input.page,
      limit: input.limit,
      total: count ?? 0,
    },
  };
};

export const approveUser = async (
  userId: string,
  adminUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<DomainUser> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'ativo',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('id', userId)
    .select(domainUserSelect)
    .single<DomainUser>();

  if (error || !data) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado');
  }

  return data;
};

export const blockUser = async (
  userId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<DomainUser> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'bloqueado',
    })
    .eq('id', userId)
    .select(domainUserSelect)
    .single<DomainUser>();

  if (error || !data) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado');
  }

  return data;
};

export const unblockUser = async (
  userId: string,
  adminUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<DomainUser> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'ativo',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('id', userId)
    .select(domainUserSelect)
    .single<DomainUser>();

  if (error || !data) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado');
  }

  return data;
};
