import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type {
  AdminInsights,
  AdminInsightsPendingUser,
  AdminCourierProfile,
  AdminStoreProfile,
  AdminUserDetail,
  DomainUser,
  UserRole,
  UserStatus,
} from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type { AdminListUsersQuery } from '../validators/admin.validators.js';

const domainUserSelect =
  'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at';
const adminStoreProfileSelect =
  'id,user_id,name,owner_name,address,description,created_at,updated_at';
const adminCourierProfileSelect = 'id,user_id,full_name,is_online,created_at,updated_at';
const adminInsightsPendingUserSelect = 'id,role,status,created_at';
const userRoles = ['admin', 'logista', 'motoboy'] as const satisfies readonly UserRole[];
const userStatuses = ['pendente', 'ativo', 'bloqueado'] as const satisfies readonly UserStatus[];
const latestPendingUsersLimit = 5;

export interface PaginatedUsers {
  items: DomainUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const createEmptyUserCounts = (): AdminInsights['user_counts'] => ({
  admin: {
    pendente: 0,
    ativo: 0,
    bloqueado: 0,
  },
  logista: {
    pendente: 0,
    ativo: 0,
    bloqueado: 0,
  },
  motoboy: {
    pendente: 0,
    ativo: 0,
    bloqueado: 0,
  },
});

const getUserCountByRoleAndStatus = async (
  role: UserRole,
  status: UserStatus,
  supabase: SupabaseClient,
) => {
  const { error, count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', role)
    .eq('status', status);

  if (error) {
    throw new ApiError(500, 'ADMIN_INSIGHTS_FAILED', 'Insights administrativos falharam');
  }

  return count ?? 0;
};

const listLatestPendingUsersByRole = async (
  role: 'logista' | 'motoboy',
  supabase: SupabaseClient,
) => {
  const { data, error } = await supabase
    .from('users')
    .select(adminInsightsPendingUserSelect)
    .eq('role', role)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
    .limit(latestPendingUsersLimit);

  if (error) {
    throw new ApiError(500, 'ADMIN_INSIGHTS_FAILED', 'Insights administrativos falharam');
  }

  return (data ?? []) as AdminInsightsPendingUser[];
};

export const getAdminInsights = async (
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<AdminInsights> => {
  const countEntries = await Promise.all(
    userRoles.flatMap((role) =>
      userStatuses.map(async (status) => ({
        role,
        status,
        count: await getUserCountByRoleAndStatus(role, status, supabase),
      })),
    ),
  );

  const userCounts = createEmptyUserCounts();

  for (const entry of countEntries) {
    userCounts[entry.role][entry.status] = entry.count;
  }

  const pendingUsersByRole = await Promise.all([
    listLatestPendingUsersByRole('logista', supabase),
    listLatestPendingUsersByRole('motoboy', supabase),
  ]);
  const latestPendingUsers = pendingUsersByRole
    .flat()
    .sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at))
    .slice(0, latestPendingUsersLimit);

  return {
    generated_at: new Date().toISOString(),
    user_counts: userCounts,
    active_accounts: {
      stores: userCounts.logista.ativo,
      couriers: userCounts.motoboy.ativo,
    },
    latest_pending_users: {
      limit: latestPendingUsersLimit,
      items: latestPendingUsers,
    },
  };
};

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

export const getUserDetail = async (
  userId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<AdminUserDetail> => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(domainUserSelect)
    .eq('id', userId)
    .single<DomainUser>();

  if (userError || !user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado');
  }

  if (user.role === 'admin') {
    return {
      user,
      profile: null,
    };
  }

  if (user.role === 'logista') {
    const { data: profile, error: profileError } = await supabase
      .from('stores')
      .select(adminStoreProfileSelect)
      .eq('user_id', user.id)
      .single<AdminStoreProfile>();

    if (profileError || !profile) {
      throw new ApiError(500, 'ADMIN_USER_PROFILE_FAILED', 'Perfil do usuario nao encontrado');
    }

    return {
      user,
      profile,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('couriers')
    .select(adminCourierProfileSelect)
    .eq('user_id', user.id)
    .single<AdminCourierProfile>();

  if (profileError || !profile) {
    throw new ApiError(500, 'ADMIN_USER_PROFILE_FAILED', 'Perfil do usuario nao encontrado');
  }

  return {
    user,
    profile,
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
