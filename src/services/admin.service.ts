import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type {
  AdminInsights,
  AdminInsightsPendingUser,
  AdminCourierProfile,
  AdminStoreProfile,
  AdminUserDetail,
  AdminUserListItem,
  DeliveryStatus,
  DomainUser,
  UserRole,
  UserStatus,
} from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type {
  AdminListDeliveriesQuery,
  AdminListPaymentsQuery,
  AdminListUsersQuery,
} from '../validators/admin.validators.js';

const domainUserSelect =
  'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at';
// Embed da loja (relacao 1:1 stores.user_id unique -> users.id) para a
// listagem admin. Mantem uma unica query (sem N+1) e expoe apenas o nome,
// que ja e visivel ao admin no detalhe; nenhum campo de Storage/PII novo.
const adminUserListSelect = `${domainUserSelect},stores(name)`;
const adminStoreProfileSelect =
  'id,user_id,name,owner_name,address,description,created_at,updated_at';
const adminCourierProfileSelect = 'id,user_id,full_name,is_online,created_at,updated_at';
const adminInsightsPendingUserSelect = 'id,role,status,created_at';
const adminDeliveryListSelect =
  'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at,stores(name,address)';
const adminPaymentListSelect =
  'id,reference_month,due_date,paid,paid_at,created_at,updated_at,users!payments_user_id_fkey!inner(role,status,stores(name))';
const userRoles = ['admin', 'logista', 'motoboy'] as const satisfies readonly UserRole[];
const userStatuses = ['pendente', 'ativo', 'bloqueado'] as const satisfies readonly UserStatus[];
const latestPendingUsersLimit = 5;
const paymentVisibleRoles = ['logista', 'motoboy'] as const;
const databaseNow = 'now';

export interface PaginatedUsers {
  items: AdminUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface AdminDeliveryStoreSummary {
  name: string;
  address: string;
}

interface AdminDeliveryRow {
  id: string;
  destination_address: string | null;
  notes: string | null;
  status: DeliveryStatus;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  collected_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  updated_at: string;
  stores?: AdminDeliveryStoreSummary | AdminDeliveryStoreSummary[] | null;
}

export interface AdminDeliveryListItem {
  id: string;
  destination_address: string | null;
  notes: string | null;
  status: DeliveryStatus;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  collected_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  updated_at: string;
  store: AdminDeliveryStoreSummary;
}

export interface PaginatedAdminDeliveries {
  items: AdminDeliveryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface AdminPaymentStoreSummary {
  name: string;
}

interface AdminPaymentUserSummaryRelation {
  role: UserRole;
  status: UserStatus;
  stores?: AdminPaymentStoreSummary | AdminPaymentStoreSummary[] | null;
}

interface AdminPaymentRow {
  id: string;
  reference_month: string;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  users?: AdminPaymentUserSummaryRelation | AdminPaymentUserSummaryRelation[] | null;
}

export interface AdminPaymentListItem {
  id: string;
  reference_month: string;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    role: UserRole | null;
    status: UserStatus | null;
    store_name: string | null;
  };
}

export interface PaginatedAdminPayments {
  items: AdminPaymentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const extractStoreName = (row: unknown): string | null => {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const relation = (row as { stores?: unknown }).stores;

  if (!relation) {
    return null;
  }

  const record = Array.isArray(relation) ? relation[0] : relation;
  const name = (record as { name?: unknown } | undefined)?.name;

  return typeof name === 'string' ? name : null;
};

const toAdminUserListItem = (row: Record<string, unknown>): AdminUserListItem => {
  const { stores: _stores, ...domain } = row;

  return {
    ...(domain as unknown as DomainUser),
    store_name: extractStoreName(row),
  };
};

const normalizeDeliveryStoreSummary = (
  relation: AdminDeliveryRow['stores'],
): AdminDeliveryStoreSummary => {
  const store = Array.isArray(relation) ? relation[0] : relation;

  return {
    name: typeof store?.name === 'string' ? store.name : '',
    address: typeof store?.address === 'string' ? store.address : '',
  };
};

const toAdminDeliveryListItem = (row: AdminDeliveryRow): AdminDeliveryListItem => ({
  id: row.id,
  destination_address: row.destination_address,
  notes: row.notes,
  status: row.status,
  created_at: row.created_at,
  expires_at: row.expires_at,
  accepted_at: row.accepted_at,
  collected_at: row.collected_at,
  in_transit_at: row.in_transit_at,
  delivered_at: row.delivered_at,
  updated_at: row.updated_at,
  store: normalizeDeliveryStoreSummary(row.stores),
});

const normalizePaymentUserRelation = (
  relation: AdminPaymentRow['users'],
): AdminPaymentListItem['user'] => {
  const user = Array.isArray(relation) ? relation[0] : relation;
  const stores = Array.isArray(user?.stores) ? user?.stores[0] : user?.stores;

  return {
    role: user?.role ?? null,
    status: user?.status ?? null,
    store_name: typeof stores?.name === 'string' ? stores.name : null,
  };
};

const toAdminPaymentListItem = (row: AdminPaymentRow): AdminPaymentListItem => ({
  id: row.id,
  reference_month: row.reference_month,
  due_date: row.due_date,
  paid: row.paid,
  paid_at: row.paid_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  user: normalizePaymentUserRelation(row.users),
});

const logAdminPaymentMarkPaid = (paymentId: string, result: string) => {
  console.log(
    JSON.stringify({
      event: 'payment_mark_paid',
      payment_id: paymentId,
      result,
    }),
  );
};

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

export const listAdminDeliveries = async (
  input: AdminListDeliveriesQuery,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<PaginatedAdminDeliveries> => {
  const offset = (input.page - 1) * input.limit;
  let query = supabase
    .from('delivery_requests')
    .select(adminDeliveryListSelect, { count: 'exact' });

  if (input.status) {
    query = query.eq('status', input.status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + input.limit - 1);

  if (error) {
    throw new ApiError(500, 'ADMIN_DELIVERIES_LIST_FAILED', 'Listagem de entregas falhou');
  }

  return {
    items: ((data ?? []) as AdminDeliveryRow[]).map(toAdminDeliveryListItem),
    pagination: {
      page: input.page,
      limit: input.limit,
      total: count ?? 0,
    },
  };
};

export const listAdminPayments = async (
  input: AdminListPaymentsQuery,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<PaginatedAdminPayments> => {
  const offset = (input.page - 1) * input.limit;
  let query = supabase
    .from('payments')
    .select(adminPaymentListSelect, { count: 'exact' })
    .eq('paid', input.paid)
    .in('users.role', input.role ? [input.role] : [...paymentVisibleRoles]);

  if (input.referenceMonth) {
    query = query.eq('reference_month', input.referenceMonth);
  }

  if (input.userStatus) {
    query = query.eq('users.status', input.userStatus);
  }

  const { data, error, count } = await query
    .order('reference_month', { ascending: false })
    .order('due_date', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + input.limit - 1);

  if (error) {
    throw new ApiError(500, 'ADMIN_PAYMENTS_LIST_FAILED', 'Listagem de pagamentos falhou');
  }

  return {
    items: ((data ?? []) as AdminPaymentRow[]).map(toAdminPaymentListItem),
    pagination: {
      page: input.page,
      limit: input.limit,
      total: count ?? 0,
    },
  };
};

const getAdminPaymentById = async (
  paymentId: string,
  supabase: SupabaseClient,
): Promise<AdminPaymentRow | null> => {
  const { data, error } = await supabase
    .from('payments')
    .select(adminPaymentListSelect)
    .eq('id', paymentId)
    .maybeSingle<AdminPaymentRow>();

  if (error) {
    throw new ApiError(500, 'ADMIN_PAYMENT_MARK_PAID_FAILED', 'Marcacao de pagamento falhou');
  }

  return data ?? null;
};

export const markAdminPaymentPaid = async (
  paymentId: string,
  adminUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<AdminPaymentListItem> => {
  const { data: updated, error: updateError } = await supabase
    .from('payments')
    .update({
      paid: true,
      paid_at: databaseNow,
      marked_by: adminUserId,
    })
    .eq('id', paymentId)
    .eq('paid', false)
    .select(adminPaymentListSelect)
    .maybeSingle<AdminPaymentRow>();

  if (updateError) {
    logAdminPaymentMarkPaid(paymentId, 'failed');
    throw new ApiError(500, 'ADMIN_PAYMENT_MARK_PAID_FAILED', 'Marcacao de pagamento falhou');
  }

  if (updated) {
    logAdminPaymentMarkPaid(paymentId, 'marked_paid');
    return toAdminPaymentListItem(updated);
  }

  const current = await getAdminPaymentById(paymentId, supabase);

  if (!current) {
    logAdminPaymentMarkPaid(paymentId, 'not_found');
    throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'Pagamento nao encontrado');
  }

  if (current.paid) {
    logAdminPaymentMarkPaid(paymentId, 'idempotent');
    return toAdminPaymentListItem(current);
  }

  logAdminPaymentMarkPaid(paymentId, 'failed');
  throw new ApiError(500, 'ADMIN_PAYMENT_MARK_PAID_FAILED', 'Marcacao de pagamento falhou');
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
    .select(adminUserListSelect, { count: 'exact' })
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
    items: ((data ?? []) as Record<string, unknown>[]).map(toAdminUserListItem),
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
