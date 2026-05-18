import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AdminCourierProfile,
  AdminInsightsPendingUser,
  AdminStoreProfile,
  DeliveryStatus,
  DomainUser,
  UserRole,
  UserStatus,
} from '../src/types/domain.js';

const supabaseMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../src/config/supabase.js', () => ({
  getSupabaseAdminClient: () => ({
    auth: {
      getUser: supabaseMock.getUser,
    },
    from: supabaseMock.from,
  }),
}));

const { app } = await import('../src/app.js');

const activeAdmin: DomainUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  auth_id: 'auth-admin',
  email: 'admin@example.com',
  role: 'admin',
  status: 'ativo',
  approved_at: '2026-05-14T00:00:00.000Z',
  approved_by: null,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const pendingAdmin: DomainUser = {
  ...activeAdmin,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-bbbbbbbbbbbb',
  auth_id: 'auth-pending-admin',
  status: 'pendente',
  approved_at: null,
  approved_by: null,
};

const blockedAdmin: DomainUser = {
  ...activeAdmin,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-cccccccccccc',
  auth_id: 'auth-blocked-admin',
  status: 'bloqueado',
};

const activeStoreUser: DomainUser = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  auth_id: 'auth-store',
  email: 'store@example.com',
  role: 'logista',
  status: 'ativo',
  approved_at: '2026-05-14T00:00:00.000Z',
  approved_by: activeAdmin.id,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const activeCourierUser: DomainUser = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  auth_id: 'auth-courier',
  email: 'courier@example.com',
  role: 'motoboy',
  status: 'ativo',
  approved_at: '2026-05-14T00:00:00.000Z',
  approved_by: activeAdmin.id,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const storeProfile: AdminStoreProfile = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  user_id: activeStoreUser.id,
  name: 'Loja Teste',
  owner_name: 'Pessoa Teste',
  address: 'Rua Teste, 123',
  description: 'Descricao interna',
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const courierProfile: AdminCourierProfile = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  user_id: activeCourierUser.id,
  full_name: 'Motoboy Teste',
  is_online: true,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

type SupabaseResult = {
  data: unknown;
  error: unknown;
};

const notFoundResult = {
  data: null,
  error: {
    message: 'not found',
  },
};

const createSelectTableByColumn = (results: Record<string, SupabaseResult>) => {
  const select = vi.fn(() => ({
    eq: vi.fn((column: string) => ({
      single: vi.fn().mockResolvedValue(results[column] ?? notFoundResult),
    })),
  }));

  return {
    select,
  };
};

type CountKey = `${UserRole}:${UserStatus}`;
type PendingRole = AdminInsightsPendingUser['role'];
type PaymentCountKey = 'paid' | 'pending';

const countKey = (role: UserRole, status: UserStatus): CountKey => `${role}:${status}`;

const createAdminInsightsUsersTable = ({
  authUser = activeAdmin,
  counts = {},
  pendingUsers = {},
  failCountFor,
}: {
  authUser?: DomainUser;
  counts?: Partial<Record<CountKey, number>>;
  pendingUsers?: Partial<Record<PendingRole, AdminInsightsPendingUser[]>>;
  failCountFor?: CountKey;
}) => {
  const select = vi.fn((columns: string, options?: { count?: string; head?: boolean }) => {
    if (columns === 'id' && options?.count === 'exact' && options.head === true) {
      return {
        eq: vi.fn((_roleColumn: string, role: UserRole) => ({
          eq: vi.fn((_statusColumn: string, status: UserStatus) => {
            if (failCountFor === countKey(role, status)) {
              return Promise.resolve({
                data: null,
                count: null,
                error: {
                  message: 'count failed',
                },
              });
            }

            return Promise.resolve({
              data: null,
              count: counts[countKey(role, status)] ?? 0,
              error: null,
            });
          }),
        })),
      };
    }

    if (columns === 'id,role,status,created_at') {
      return {
        eq: vi.fn((_roleColumn: string, role: PendingRole) => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn((limit: number) =>
                Promise.resolve({
                  data: (pendingUsers[role] ?? []).slice(0, limit),
                  error: null,
                }),
              ),
            })),
          })),
        })),
      };
    }

    return {
      eq: vi.fn((column: string) => ({
        single: vi.fn().mockResolvedValue(
          column === 'auth_id'
            ? {
                data: authUser,
                error: null,
              }
            : notFoundResult,
        ),
      })),
    };
  });

  return {
    select,
  };
};

const createAdminInsightsDeliveryRequestsTable = ({
  counts = {},
  failCountFor,
}: {
  counts?: Partial<Record<DeliveryStatus, number>>;
  failCountFor?: DeliveryStatus;
} = {}) => {
  const select = vi.fn((columns: string, options?: { count?: string; head?: boolean }) => {
    if (columns === 'id' && options?.count === 'exact' && options.head === true) {
      return {
        eq: vi.fn((_statusColumn: string, status: DeliveryStatus) =>
          Promise.resolve({
            data: null,
            count: counts[status] ?? 0,
            error: failCountFor === status ? { message: 'delivery count failed' } : null,
          }),
        ),
      };
    }

    return {
      eq: vi.fn(),
    };
  });

  return {
    select,
  };
};

const createAdminInsightsPaymentsTable = ({
  counts = {},
  failCountFor,
}: {
  counts?: Partial<Record<PaymentCountKey, number>>;
  failCountFor?: PaymentCountKey;
} = {}) => {
  const select = vi.fn((columns: string, options?: { count?: string; head?: boolean }) => {
    if (columns === 'id' && options?.count === 'exact' && options.head === true) {
      return {
        eq: vi.fn((_paidColumn: string, paid: boolean) => {
          const key: PaymentCountKey = paid ? 'paid' : 'pending';

          return Promise.resolve({
            data: null,
            count: counts[key] ?? 0,
            error: failCountFor === key ? { message: 'payment count failed' } : null,
          });
        }),
      };
    }

    return {
      eq: vi.fn(),
    };
  });

  return {
    select,
  };
};

const mockAdminInsightsTables = ({
  usersTable = createAdminInsightsUsersTable({}),
  deliveryRequestsTable = createAdminInsightsDeliveryRequestsTable(),
  paymentsTable = createAdminInsightsPaymentsTable(),
}: {
  usersTable?: ReturnType<typeof createAdminInsightsUsersTable>;
  deliveryRequestsTable?: ReturnType<typeof createAdminInsightsDeliveryRequestsTable>;
  paymentsTable?: ReturnType<typeof createAdminInsightsPaymentsTable>;
} = {}) => {
  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') return usersTable;
    if (table === 'delivery_requests') return deliveryRequestsTable;
    if (table === 'payments') return paymentsTable;

    return {
      select: vi.fn(),
    };
  });
};

const mockAuthUser = (authUserId = 'auth-admin') => {
  supabaseMock.getUser.mockResolvedValue({
    data: {
      user: {
        id: authUserId,
      },
    },
    error: null,
  });
};

describe('admin insights route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects insights requests without a bearer token', async () => {
    const response = await request(app).get('/api/admin/insights').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
      },
    });
  });

  it('rejects insights requests from authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createAdminInsightsUsersTable({
        authUser: activeStoreUser,
      }),
    );

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('rejects unsupported insights query parameters', async () => {
    mockAuthUser();
    supabaseMock.from.mockReturnValue(createAdminInsightsUsersTable({}));

    const response = await request(app)
      .get('/api/admin/insights?limit=10')
      .set('Authorization', 'Bearer admin-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it('returns minimal insights for active admins without querying profile tables or PII', async () => {
    mockAuthUser();

    const newestPending: AdminInsightsPendingUser = {
      id: '11111111-1111-4111-8111-111111111111',
      role: 'logista',
      status: 'pendente',
      created_at: '2026-05-15T11:00:00.000Z',
    };
    const olderPending: AdminInsightsPendingUser = {
      id: '22222222-2222-4222-8222-222222222222',
      role: 'motoboy',
      status: 'pendente',
      created_at: '2026-05-15T10:00:00.000Z',
    };

    const usersTable = createAdminInsightsUsersTable({
      counts: {
        [countKey('admin', 'ativo')]: 1,
        [countKey('logista', 'pendente')]: 2,
        [countKey('logista', 'ativo')]: 10,
        [countKey('logista', 'bloqueado')]: 1,
        [countKey('motoboy', 'pendente')]: 3,
        [countKey('motoboy', 'ativo')]: 8,
      },
      pendingUsers: {
        logista: [newestPending],
        motoboy: [olderPending],
      },
    });
    const deliveryRequestsTable = createAdminInsightsDeliveryRequestsTable({
      counts: {
        aguardando: 4,
        aceita: 3,
        coletada: 2,
        em_transito: 1,
        entregue: 9,
        expirada: 5,
        cancelada: 6,
      },
    });
    const paymentsTable = createAdminInsightsPaymentsTable({
      counts: {
        paid: 7,
        pending: 11,
      },
    });
    mockAdminInsightsTables({ usersTable, deliveryRequestsTable, paymentsTable });

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        user_counts: {
          admin: {
            pendente: 0,
            ativo: 1,
            bloqueado: 0,
          },
          logista: {
            pendente: 2,
            ativo: 10,
            bloqueado: 1,
          },
          motoboy: {
            pendente: 3,
            ativo: 8,
            bloqueado: 0,
          },
        },
        active_accounts: {
          stores: 10,
          couriers: 8,
        },
        delivery_counts_by_status: {
          aguardando: 4,
          aceita: 3,
          coletada: 2,
          em_transito: 1,
          entregue: 9,
          expirada: 5,
          cancelada: 6,
        },
        payment_counts: {
          paid: 7,
          pending: 11,
        },
        latest_pending_users: {
          limit: 5,
          items: [newestPending, olderPending],
        },
      },
      message: 'Insights administrativos gerados',
    });
    expect(Date.parse(response.body.data.generated_at)).not.toBeNaN();
    const queriedTables = supabaseMock.from.mock.calls.map(([table]) => table);
    expect(queriedTables).toContain('users');
    expect(queriedTables).toContain('delivery_requests');
    expect(queriedTables).toContain('payments');
    expect(queriedTables).not.toContain('stores');
    expect(queriedTables).not.toContain('couriers');

    const serializedData = JSON.stringify(response.body.data);
    expect(serializedData).not.toContain('email');
    expect(serializedData).not.toContain('auth_id');
    expect(serializedData).not.toContain('approved_by');
    expect(serializedData).not.toContain('owner_name');
    expect(serializedData).not.toContain('address');
    expect(serializedData).not.toContain('full_name');
    expect(serializedData).not.toContain('logo_url');
    expect(serializedData).not.toContain('bike_photo_url');
    expect(serializedData).not.toContain('license_photo_url');
    expect(serializedData).not.toContain('store_id');
    expect(serializedData).not.toContain('courier_id');
    expect(serializedData).not.toContain('user_id');
    expect(serializedData).not.toContain('reference_month');
    expect(serializedData).not.toContain('due_date');
    expect(serializedData).not.toContain('paid_at');
    expect(serializedData).not.toContain('marked_by');
    expect(serializedData).not.toContain('amount');
    expect(serializedData).not.toContain('pix');
    expect(serializedData).not.toContain('card');
    expect(serializedData).not.toContain('receipt');
  });

  it('returns zero defaults for delivery and payment counts without rows', async () => {
    mockAuthUser();
    mockAdminInsightsTables();

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body.data.delivery_counts_by_status).toEqual({
      aguardando: 0,
      aceita: 0,
      coletada: 0,
      em_transito: 0,
      entregue: 0,
      expirada: 0,
      cancelada: 0,
    });
    expect(response.body.data.payment_counts).toEqual({
      paid: 0,
      pending: 0,
    });
  });

  it('limits latest pending users to five after merging role-specific queries', async () => {
    mockAuthUser();

    const pendingUsers = Array.from({ length: 6 }, (_, index) => ({
      id: `${index + 1}`.repeat(8) + '-1111-4111-8111-111111111111',
      role: index % 2 === 0 ? 'logista' : 'motoboy',
      status: 'pendente',
      created_at: `2026-05-15T1${index}:00:00.000Z`,
    })) satisfies AdminInsightsPendingUser[];

    mockAdminInsightsTables({
      usersTable: createAdminInsightsUsersTable({
        pendingUsers: {
          logista: pendingUsers.filter((user) => user.role === 'logista'),
          motoboy: pendingUsers.filter((user) => user.role === 'motoboy'),
        },
      }),
    });

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body.data.latest_pending_users.items).toHaveLength(5);
    expect(response.body.data.latest_pending_users.items[0].created_at).toBe(
      '2026-05-15T15:00:00.000Z',
    );
  });

  it('returns a standardized error when an insights query fails', async () => {
    mockAuthUser();
    supabaseMock.from.mockReturnValue(
      createAdminInsightsUsersTable({
        failCountFor: countKey('logista', 'ativo'),
      }),
    );

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'ADMIN_INSIGHTS_FAILED',
        message: 'Insights administrativos falharam',
      },
    });
  });

  it('returns a standardized error when an insights delivery count fails', async () => {
    mockAuthUser();
    mockAdminInsightsTables({
      deliveryRequestsTable: createAdminInsightsDeliveryRequestsTable({
        failCountFor: 'entregue',
      }),
    });

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'ADMIN_INSIGHTS_FAILED',
        message: 'Insights administrativos falharam',
      },
    });
  });

  it('returns a standardized error when an insights payment count fails', async () => {
    mockAuthUser();
    mockAdminInsightsTables({
      paymentsTable: createAdminInsightsPaymentsTable({
        failCountFor: 'pending',
      }),
    });

    const response = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'ADMIN_INSIGHTS_FAILED',
        message: 'Insights administrativos falharam',
      },
    });
  });
});

describe('admin user detail route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects detail requests without a bearer token', async () => {
    const response = await request(app).get(`/api/admin/users/${activeStoreUser.id}`).expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
      },
    });
  });

  it('rejects detail requests from authenticated non-admin users', async () => {
    mockAuthUser('auth-store');

    const usersTable = createSelectTableByColumn({
      auth_id: {
        data: activeStoreUser,
        error: null,
      },
    });
    supabaseMock.from.mockReturnValue(usersTable);

    const response = await request(app)
      .get(`/api/admin/users/${activeCourierUser.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('returns a store user with an expanded store profile for active admins', async () => {
    mockAuthUser();

    const usersTable = createSelectTableByColumn({
      auth_id: {
        data: activeAdmin,
        error: null,
      },
      id: {
        data: activeStoreUser,
        error: null,
      },
    });
    const storesTable = createSelectTableByColumn({
      user_id: {
        data: storeProfile,
        error: null,
      },
    });
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return usersTable;
      if (table === 'stores') return storesTable;
      return createSelectTableByColumn({});
    });

    const response = await request(app)
      .get(`/api/admin/users/${activeStoreUser.id}`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: activeStoreUser,
        profile: storeProfile,
      },
      message: 'Usuario encontrado',
    });
    expect(storesTable.select).toHaveBeenCalledWith(
      'id,user_id,name,owner_name,address,description,created_at,updated_at',
    );
  });

  it('returns an admin user with a null profile', async () => {
    mockAuthUser();

    const usersTable = createSelectTableByColumn({
      auth_id: {
        data: activeAdmin,
        error: null,
      },
      id: {
        data: activeAdmin,
        error: null,
      },
    });
    supabaseMock.from.mockReturnValue(usersTable);

    const response = await request(app)
      .get(`/api/admin/users/${activeAdmin.id}`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body.data).toEqual({
      user: activeAdmin,
      profile: null,
    });
    expect(supabaseMock.from).not.toHaveBeenCalledWith('stores');
    expect(supabaseMock.from).not.toHaveBeenCalledWith('couriers');
  });

  it('returns a courier user without document or storage fields', async () => {
    mockAuthUser();

    const usersTable = createSelectTableByColumn({
      auth_id: {
        data: activeAdmin,
        error: null,
      },
      id: {
        data: activeCourierUser,
        error: null,
      },
    });
    const couriersTable = createSelectTableByColumn({
      user_id: {
        data: courierProfile,
        error: null,
      },
    });
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return usersTable;
      if (table === 'couriers') return couriersTable;
      return createSelectTableByColumn({});
    });

    const response = await request(app)
      .get(`/api/admin/users/${activeCourierUser.id}`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    const serializedData = JSON.stringify(response.body.data);

    expect(response.body.data).toEqual({
      user: activeCourierUser,
      profile: courierProfile,
    });
    expect(serializedData).not.toContain('bike_photo_url');
    expect(serializedData).not.toContain('license_photo_url');
    expect(serializedData).not.toContain('logo_url');
    expect(couriersTable.select).toHaveBeenCalledWith(
      'id,user_id,full_name,is_online,created_at,updated_at',
    );
  });

  it('returns 404 when the requested user does not exist', async () => {
    mockAuthUser();

    const usersTable = createSelectTableByColumn({
      auth_id: {
        data: activeAdmin,
        error: null,
      },
      id: notFoundResult,
    });
    supabaseMock.from.mockReturnValue(usersTable);

    const response = await request(app)
      .get('/api/admin/users/ffffffff-ffff-4fff-8fff-ffffffffffff')
      .set('Authorization', 'Bearer admin-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
      },
    });
  });
});

const createAdminUsersListTable = ({
  authUser,
  rows,
  count,
}: {
  authUser: DomainUser;
  rows: Record<string, unknown>[];
  count: number;
}) => {
  const select = vi.fn((_columns: string, options?: { count?: string }) => {
    if (options?.count === 'exact') {
      const builder = {
        eq: vi.fn(() => builder),
        ilike: vi.fn(() => builder),
        order: vi.fn(() => builder),
        range: vi.fn().mockResolvedValue({ data: rows, error: null, count }),
      };
      return builder;
    }

    return {
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: authUser, error: null }),
      })),
    };
  });

  return { select };
};

const adminDeliveryRow = {
  id: '11111111-1111-4111-8111-111111111111',
  destination_address: 'Rua Cliente, 42',
  notes: 'Entregar na portaria',
  status: 'entregue',
  created_at: '2026-05-17T12:00:00.000Z',
  expires_at: '2026-05-17T12:10:00.000Z',
  accepted_at: '2026-05-17T12:01:00.000Z',
  collected_at: '2026-05-17T12:03:00.000Z',
  in_transit_at: '2026-05-17T12:06:00.000Z',
  delivered_at: '2026-05-17T12:12:00.000Z',
  updated_at: '2026-05-17T12:12:00.000Z',
  stores: {
    name: storeProfile.name,
    address: storeProfile.address,
    owner_name: storeProfile.owner_name,
    logo_url: 'https://storage.example/logo.png',
    description: storeProfile.description,
  },
  store_id: storeProfile.id,
  courier_id: courierProfile.id,
  user_id: activeStoreUser.id,
  auth_id: activeStoreUser.auth_id,
  email: activeStoreUser.email,
  full_name: courierProfile.full_name,
  bike_photo_url: 'https://storage.example/bike.png',
  license_photo_url: 'https://storage.example/license.png',
};

const createAdminDeliveriesListTable = ({
  rows,
  count,
  error = null,
}: {
  rows: Record<string, unknown>[] | null;
  count: number | null;
  error?: unknown;
}) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn().mockResolvedValue({ data: rows, error, count }),
  };

  return builder;
};

const createAdminDeliveryDetailTable = ({
  row,
  error = null,
}: {
  row: Record<string, unknown> | null;
  error?: unknown;
}) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
    order: vi.fn(() => builder),
    range: vi.fn(),
  };

  return builder;
};

const mockAdminDeliveryListTables = (
  authUser: DomainUser,
  deliveryRequestsTable: ReturnType<typeof createAdminDeliveriesListTable>,
) => {
  const usersTable = createSelectTableByColumn({
    auth_id: {
      data: authUser,
      error: null,
    },
  });

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') return usersTable;
    if (table === 'delivery_requests') return deliveryRequestsTable;
    return createSelectTableByColumn({});
  });

  return usersTable;
};

const mockAdminDeliveryDetailTables = (
  authUser: DomainUser,
  deliveryRequestsTable: ReturnType<typeof createAdminDeliveryDetailTable>,
) => {
  const usersTable = createSelectTableByColumn({
    auth_id: {
      data: authUser,
      error: null,
    },
  });

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') return usersTable;
    if (table === 'delivery_requests') return deliveryRequestsTable;
    return createSelectTableByColumn({});
  });

  return usersTable;
};

const createAdminUserDeliveriesProfileTable = ({
  row,
  error = null,
}: {
  row: Record<string, unknown> | null;
  error?: unknown;
}) => {
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: row, error }),
    })),
  }));

  return { select };
};

const mockAdminUserDeliveriesTables = ({
  authUser = activeAdmin,
  targetUser,
  profileTableName,
  profileTable,
  deliveryRequestsTable,
}: {
  authUser?: DomainUser;
  targetUser: SupabaseResult;
  profileTableName?: 'stores' | 'couriers';
  profileTable?: ReturnType<typeof createAdminUserDeliveriesProfileTable>;
  deliveryRequestsTable?: ReturnType<typeof createAdminDeliveriesListTable>;
}) => {
  const usersTable = createSelectTableByColumn({
    auth_id: {
      data: authUser,
      error: null,
    },
    id: targetUser,
  });

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') return usersTable;
    if (profileTableName && table === profileTableName) return profileTable;
    if (table === 'delivery_requests') return deliveryRequestsTable;
    return createSelectTableByColumn({});
  });

  return usersTable;
};

describe('admin deliveries list route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects the list without a bearer token', async () => {
    const response = await request(app).get('/api/admin/deliveries').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects the list for authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: activeStoreUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get('/api/admin/deliveries')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingAdmin, 'auth-pending-admin', 'USER_PENDING'],
    [blockedAdmin, 'auth-blocked-admin', 'USER_BLOCKED'],
  ])('rejects the list for admin users with status %s', async (domainUser, authId, code) => {
    mockAuthUser(authId);
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: domainUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get('/api/admin/deliveries')
      .set('Authorization', 'Bearer admin-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('lists deliveries with a strict whitelist and no courier data', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [adminDeliveryRow],
      count: 1,
    });
    mockAdminDeliveryListTables(activeAdmin, deliveryRequestsTable);

    const response = await request(app)
      .get('/api/admin/deliveries')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(deliveryRequestsTable.select).toHaveBeenCalledWith(
      'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at,stores(name,address)',
      { count: 'exact' },
    );
    expect(deliveryRequestsTable.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
    });
    expect(deliveryRequestsTable.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(deliveryRequestsTable.range).toHaveBeenCalledWith(0, 19);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: adminDeliveryRow.id,
            destination_address: adminDeliveryRow.destination_address,
            notes: adminDeliveryRow.notes,
            status: adminDeliveryRow.status,
            created_at: adminDeliveryRow.created_at,
            expires_at: adminDeliveryRow.expires_at,
            accepted_at: adminDeliveryRow.accepted_at,
            collected_at: adminDeliveryRow.collected_at,
            in_transit_at: adminDeliveryRow.in_transit_at,
            delivered_at: adminDeliveryRow.delivered_at,
            updated_at: adminDeliveryRow.updated_at,
            store: {
              name: storeProfile.name,
              address: storeProfile.address,
            },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
      message: 'Entregas administrativas encontradas',
    });

    const serializedData = JSON.stringify(response.body.data);
    expect(serializedData).not.toContain('store_id');
    expect(serializedData).not.toContain('courier_id');
    expect(serializedData).not.toContain('user_id');
    expect(serializedData).not.toContain('auth_id');
    expect(serializedData).not.toContain('email');
    expect(serializedData).not.toContain('owner_name');
    expect(serializedData).not.toContain('logo_url');
    expect(serializedData).not.toContain('description');
    expect(serializedData).not.toContain('full_name');
    expect(serializedData).not.toContain('bike_photo_url');
    expect(serializedData).not.toContain('license_photo_url');
  });

  it('applies status filter and pagination range', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [adminDeliveryRow],
      count: 21,
    });
    mockAdminDeliveryListTables(activeAdmin, deliveryRequestsTable);

    await request(app)
      .get('/api/admin/deliveries?status=entregue&page=2&limit=10')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(deliveryRequestsTable.eq).toHaveBeenCalledWith('status', 'entregue');
    expect(deliveryRequestsTable.range).toHaveBeenCalledWith(10, 19);
  });

  it.each(['limit=51', 'unknown=1', 'courier_id=eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'])(
    'rejects invalid or unknown delivery query parameters: %s',
    async (queryString) => {
      mockAuthUser();
      const deliveryRequestsTable = createAdminDeliveriesListTable({
        rows: [],
        count: 0,
      });
      mockAdminDeliveryListTables(activeAdmin, deliveryRequestsTable);

      const response = await request(app)
        .get(`/api/admin/deliveries?${queryString}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
      expect(deliveryRequestsTable.select).not.toHaveBeenCalled();
    },
  );

  it('returns a standardized failure when the delivery query fails', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: null,
      count: null,
      error: { message: 'db down' },
    });
    mockAdminDeliveryListTables(activeAdmin, deliveryRequestsTable);

    const response = await request(app)
      .get('/api/admin/deliveries')
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_DELIVERIES_LIST_FAILED' },
    });
  });
});

describe('admin delivery detail route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  const detailPath = `/api/admin/deliveries/${adminDeliveryRow.id}`;

  it('rejects the detail without a bearer token', async () => {
    const response = await request(app).get(detailPath).expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects the detail for authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: activeStoreUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get(detailPath)
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingAdmin, 'auth-pending-admin', 'USER_PENDING'],
    [blockedAdmin, 'auth-blocked-admin', 'USER_BLOCKED'],
  ])('rejects the detail for admin users with status %s', async (domainUser, authId, code) => {
    mockAuthUser(authId);
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: domainUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get(detailPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('returns one delivery with a strict whitelist and no courier data', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveryDetailTable({
      row: adminDeliveryRow,
    });
    mockAdminDeliveryDetailTables(activeAdmin, deliveryRequestsTable);

    const response = await request(app)
      .get(detailPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(deliveryRequestsTable.select).toHaveBeenCalledWith(
      'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at,stores(name,address)',
    );
    expect(deliveryRequestsTable.eq).toHaveBeenCalledWith('id', adminDeliveryRow.id);
    expect(deliveryRequestsTable.maybeSingle).toHaveBeenCalledTimes(1);
    expect(deliveryRequestsTable.order).not.toHaveBeenCalled();
    expect(deliveryRequestsTable.range).not.toHaveBeenCalled();

    expect(response.body).toEqual({
      success: true,
      data: {
        id: adminDeliveryRow.id,
        destination_address: adminDeliveryRow.destination_address,
        notes: adminDeliveryRow.notes,
        status: adminDeliveryRow.status,
        created_at: adminDeliveryRow.created_at,
        expires_at: adminDeliveryRow.expires_at,
        accepted_at: adminDeliveryRow.accepted_at,
        collected_at: adminDeliveryRow.collected_at,
        in_transit_at: adminDeliveryRow.in_transit_at,
        delivered_at: adminDeliveryRow.delivered_at,
        updated_at: adminDeliveryRow.updated_at,
        store: {
          name: storeProfile.name,
          address: storeProfile.address,
        },
      },
      message: 'Entrega administrativa encontrada',
    });

    const serializedData = JSON.stringify(response.body.data);
    expect(serializedData).not.toContain('store_id');
    expect(serializedData).not.toContain('courier_id');
    expect(serializedData).not.toContain('user_id');
    expect(serializedData).not.toContain('auth_id');
    expect(serializedData).not.toContain('email');
    expect(serializedData).not.toContain('owner_name');
    expect(serializedData).not.toContain('logo_url');
    expect(serializedData).not.toContain('description');
    expect(serializedData).not.toContain('full_name');
    expect(serializedData).not.toContain('bike_photo_url');
    expect(serializedData).not.toContain('license_photo_url');
  });

  it.each([
    '/api/admin/deliveries/not-a-uuid',
    `${detailPath}?store_id=dddddddd-dddd-4ddd-8ddd-dddddddddddd`,
    `${detailPath}?courier_id=eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee`,
    `${detailPath}?status=entregue`,
    `${detailPath}?unknown=1`,
  ])('rejects invalid params or query before reading deliveries: %s', async (path) => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveryDetailTable({
      row: adminDeliveryRow,
    });
    mockAdminDeliveryDetailTables(activeAdmin, deliveryRequestsTable);

    const response = await request(app)
      .get(path)
      .set('Authorization', 'Bearer admin-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(deliveryRequestsTable.select).not.toHaveBeenCalled();
  });

  it('returns DELIVERY_NOT_FOUND for a missing delivery', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveryDetailTable({ row: null });
    mockAdminDeliveryDetailTables(activeAdmin, deliveryRequestsTable);

    const response = await request(app)
      .get(detailPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_NOT_FOUND' },
    });
  });

  it('returns a standardized failure when the delivery detail query fails', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveryDetailTable({
      row: null,
      error: { message: 'db down' },
    });
    mockAdminDeliveryDetailTables(activeAdmin, deliveryRequestsTable);

    const response = await request(app)
      .get(detailPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_DELIVERY_GET_FAILED' },
    });
  });
});

describe('admin user deliveries route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  const storeUserDeliveriesPath = `/api/admin/users/${activeStoreUser.id}/deliveries`;
  const courierUserDeliveriesPath = `/api/admin/users/${activeCourierUser.id}/deliveries`;

  it('rejects user delivery list requests without a bearer token', async () => {
    const response = await request(app).get(storeUserDeliveriesPath).expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects user delivery list requests from authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: activeStoreUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get(storeUserDeliveriesPath)
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingAdmin, 'auth-pending-admin', 'USER_PENDING'],
    [blockedAdmin, 'auth-blocked-admin', 'USER_BLOCKED'],
  ])(
    'rejects user delivery list requests for admin users with status %s',
    async (domainUser, authId, code) => {
      mockAuthUser(authId);
      supabaseMock.from.mockReturnValue(
        createSelectTableByColumn({
          auth_id: {
            data: domainUser,
            error: null,
          },
        }),
      );

      const response = await request(app)
        .get(storeUserDeliveriesPath)
        .set('Authorization', 'Bearer admin-token')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: { code },
      });
    },
  );

  it('lists store user deliveries through the linked store with a strict whitelist', async () => {
    mockAuthUser();
    const storesTable = createAdminUserDeliveriesProfileTable({
      row: { id: storeProfile.id, owner_name: storeProfile.owner_name },
    });
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [adminDeliveryRow],
      count: 1,
    });
    const usersTable = mockAdminUserDeliveriesTables({
      targetUser: { data: activeStoreUser, error: null },
      profileTableName: 'stores',
      profileTable: storesTable,
      deliveryRequestsTable,
    });

    const response = await request(app)
      .get(storeUserDeliveriesPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(usersTable.select).toHaveBeenCalledWith('id,role');
    expect(storesTable.select).toHaveBeenCalledWith('id');
    expect(deliveryRequestsTable.select).toHaveBeenCalledWith(
      'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at,stores(name,address)',
      { count: 'exact' },
    );
    expect(deliveryRequestsTable.eq).toHaveBeenCalledWith('store_id', storeProfile.id);
    expect(deliveryRequestsTable.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
    });
    expect(deliveryRequestsTable.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(deliveryRequestsTable.range).toHaveBeenCalledWith(0, 19);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: adminDeliveryRow.id,
            destination_address: adminDeliveryRow.destination_address,
            notes: adminDeliveryRow.notes,
            status: adminDeliveryRow.status,
            created_at: adminDeliveryRow.created_at,
            expires_at: adminDeliveryRow.expires_at,
            accepted_at: adminDeliveryRow.accepted_at,
            collected_at: adminDeliveryRow.collected_at,
            in_transit_at: adminDeliveryRow.in_transit_at,
            delivered_at: adminDeliveryRow.delivered_at,
            updated_at: adminDeliveryRow.updated_at,
            store: {
              name: storeProfile.name,
              address: storeProfile.address,
            },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
      message: 'Entregas administrativas do usuario encontradas',
    });

    const serializedData = JSON.stringify(response.body.data);
    expect(serializedData).not.toContain('store_id');
    expect(serializedData).not.toContain('courier_id');
    expect(serializedData).not.toContain('user_id');
    expect(serializedData).not.toContain('auth_id');
    expect(serializedData).not.toContain('email');
    expect(serializedData).not.toContain('owner_name');
    expect(serializedData).not.toContain('logo_url');
    expect(serializedData).not.toContain('description');
    expect(serializedData).not.toContain('full_name');
    expect(serializedData).not.toContain('bike_photo_url');
    expect(serializedData).not.toContain('license_photo_url');
  });

  it('lists courier user deliveries through the linked courier with status and pagination', async () => {
    mockAuthUser();
    const couriersTable = createAdminUserDeliveriesProfileTable({
      row: { id: courierProfile.id, full_name: courierProfile.full_name },
    });
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [adminDeliveryRow],
      count: 21,
    });
    mockAdminUserDeliveriesTables({
      targetUser: { data: activeCourierUser, error: null },
      profileTableName: 'couriers',
      profileTable: couriersTable,
      deliveryRequestsTable,
    });

    await request(app)
      .get(`${courierUserDeliveriesPath}?status=entregue&page=2&limit=10`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(couriersTable.select).toHaveBeenCalledWith('id');
    expect(deliveryRequestsTable.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(deliveryRequestsTable.eq).toHaveBeenCalledWith('status', 'entregue');
    expect(deliveryRequestsTable.range).toHaveBeenCalledWith(10, 19);
  });

  it('returns an honest empty list for admin target users without reading deliveries', async () => {
    mockAuthUser();
    const usersTable = mockAdminUserDeliveriesTables({
      targetUser: { data: activeAdmin, error: null },
    });

    const response = await request(app)
      .get(`/api/admin/users/${activeAdmin.id}/deliveries?page=2&limit=10`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [],
        pagination: { page: 2, limit: 10, total: 0 },
      },
      message: 'Entregas administrativas do usuario encontradas',
    });
    expect(usersTable.select).toHaveBeenCalledWith('id,role');
    expect(supabaseMock.from).not.toHaveBeenCalledWith('stores');
    expect(supabaseMock.from).not.toHaveBeenCalledWith('couriers');
    expect(supabaseMock.from).not.toHaveBeenCalledWith('delivery_requests');
  });

  it.each([
    '/api/admin/users/not-a-uuid/deliveries',
    `${storeUserDeliveriesPath}?store_id=dddddddd-dddd-4ddd-8ddd-dddddddddddd`,
    `${storeUserDeliveriesPath}?courier_id=eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee`,
    `${storeUserDeliveriesPath}?user_id=${activeStoreUser.id}`,
    `${storeUserDeliveriesPath}?auth_id=auth-store`,
    `${storeUserDeliveriesPath}?email=store@example.com`,
    `${storeUserDeliveriesPath}?unknown=1`,
    `${storeUserDeliveriesPath}?limit=51`,
    `${storeUserDeliveriesPath}?status=finalizada`,
  ])('rejects invalid params or query before reading target deliveries: %s', async (path) => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [],
      count: 0,
    });
    mockAdminUserDeliveriesTables({
      targetUser: { data: activeStoreUser, error: null },
      deliveryRequestsTable,
    });

    const response = await request(app)
      .get(path)
      .set('Authorization', 'Bearer admin-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(deliveryRequestsTable.select).not.toHaveBeenCalled();
  });

  it('returns USER_NOT_FOUND for a missing target user without reading deliveries', async () => {
    mockAuthUser();
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [],
      count: 0,
    });
    mockAdminUserDeliveriesTables({
      targetUser: notFoundResult,
      deliveryRequestsTable,
    });

    const response = await request(app)
      .get('/api/admin/users/ffffffff-ffff-4fff-8fff-ffffffffffff/deliveries')
      .set('Authorization', 'Bearer admin-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'USER_NOT_FOUND' },
    });
    expect(deliveryRequestsTable.select).not.toHaveBeenCalled();
  });

  it('returns a controlled error when the target profile is missing', async () => {
    mockAuthUser();
    const storesTable = createAdminUserDeliveriesProfileTable({
      row: null,
      error: { message: 'not found' },
    });
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: [],
      count: 0,
    });
    mockAdminUserDeliveriesTables({
      targetUser: { data: activeStoreUser, error: null },
      profileTableName: 'stores',
      profileTable: storesTable,
      deliveryRequestsTable,
    });

    const response = await request(app)
      .get(storeUserDeliveriesPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_USER_DELIVERIES_PROFILE_FAILED' },
    });
    expect(deliveryRequestsTable.select).not.toHaveBeenCalled();
  });

  it('returns a standardized failure when the target user delivery query fails', async () => {
    mockAuthUser();
    const storesTable = createAdminUserDeliveriesProfileTable({
      row: { id: storeProfile.id },
    });
    const deliveryRequestsTable = createAdminDeliveriesListTable({
      rows: null,
      count: null,
      error: { message: 'db down' },
    });
    mockAdminUserDeliveriesTables({
      targetUser: { data: activeStoreUser, error: null },
      profileTableName: 'stores',
      profileTable: storesTable,
      deliveryRequestsTable,
    });

    const response = await request(app)
      .get(storeUserDeliveriesPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_USER_DELIVERIES_LIST_FAILED' },
    });
  });
});

const adminPaymentRow = {
  id: '99999999-9999-4999-8999-999999999999',
  reference_month: '2026-05',
  due_date: '2026-05-31',
  paid: false,
  paid_at: null,
  marked_by: null,
  created_at: '2026-05-17T12:00:00.000Z',
  updated_at: '2026-05-17T12:00:00.000Z',
  users: {
    id: activeStoreUser.id,
    auth_id: activeStoreUser.auth_id,
    email: activeStoreUser.email,
    role: activeStoreUser.role,
    status: activeStoreUser.status,
    owner_name: storeProfile.owner_name,
    full_name: courierProfile.full_name,
    stores: {
      name: storeProfile.name,
      owner_name: storeProfile.owner_name,
      logo_url: 'https://storage.example/logo.png',
    },
  },
  user_id: activeStoreUser.id,
  auth_id: activeStoreUser.auth_id,
  email: activeStoreUser.email,
  owner_name: storeProfile.owner_name,
  full_name: courierProfile.full_name,
  receipt_url: 'https://storage.example/receipt.png',
  payment_method: 'pix',
  amount: 100,
};

const paidAdminPaymentRow = {
  ...adminPaymentRow,
  paid: true,
  paid_at: '2026-05-17T12:30:00.000Z',
  updated_at: '2026-05-17T12:30:00.000Z',
  marked_by: activeAdmin.id,
};

const createAdminPaymentsListTable = ({
  rows,
  count,
  error = null,
}: {
  rows: Record<string, unknown>[] | null;
  count: number | null;
  error?: unknown;
}) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn().mockResolvedValue({ data: rows, error, count }),
  };

  return builder;
};

const createAdminPaymentUpdateTable = ({
  row,
  error = null,
}: {
  row: Record<string, unknown> | null;
  error?: unknown;
}) => {
  const builder = {
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    select: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  };

  return builder;
};

const createAdminPaymentDetailTable = ({
  row,
  error = null,
}: {
  row: Record<string, unknown> | null;
  error?: unknown;
}) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  };

  return builder;
};

const mockAdminPaymentTables = (
  authUser: DomainUser,
  paymentTables: Array<
    | ReturnType<typeof createAdminPaymentsListTable>
    | ReturnType<typeof createAdminPaymentUpdateTable>
    | ReturnType<typeof createAdminPaymentDetailTable>
  >,
) => {
  const usersTable = createSelectTableByColumn({
    auth_id: {
      data: authUser,
      error: null,
    },
  });
  const queue = [...paymentTables];

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') return usersTable;
    if (table === 'payments') return queue.shift() ?? createAdminPaymentDetailTable({ row: null });
    return createSelectTableByColumn({});
  });

  return usersTable;
};

const mockAdminUserPaymentTables = ({
  authUser = activeAdmin,
  targetUser,
  paymentsTable,
}: {
  authUser?: DomainUser;
  targetUser: SupabaseResult;
  paymentsTable?: ReturnType<typeof createAdminPaymentsListTable>;
}) => {
  const usersTable = createSelectTableByColumn({
    auth_id: {
      data: authUser,
      error: null,
    },
    id: targetUser,
  });

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') return usersTable;
    if (table === 'payments') return paymentsTable;
    return createSelectTableByColumn({});
  });

  return usersTable;
};

describe('admin user payments route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  const storeUserPaymentsPath = `/api/admin/users/${activeStoreUser.id}/payments`;

  it('rejects user payment list requests without a bearer token', async () => {
    const response = await request(app).get(storeUserPaymentsPath).expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects user payment list requests from authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: activeStoreUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get(storeUserPaymentsPath)
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it('lists user payments with a strict whitelist and optional paid filter', async () => {
    mockAuthUser();
    const paymentsTable = createAdminPaymentsListTable({
      rows: [adminPaymentRow],
      count: 1,
    });
    const usersTable = mockAdminUserPaymentTables({
      targetUser: { data: activeStoreUser, error: null },
      paymentsTable,
    });

    const response = await request(app)
      .get(`${storeUserPaymentsPath}?paid=false&page=2&limit=10`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(usersTable.select).toHaveBeenCalledWith('id,role');
    expect(paymentsTable.select).toHaveBeenCalledWith(
      'id,reference_month,due_date,paid,paid_at,created_at,updated_at',
      { count: 'exact' },
    );
    expect(paymentsTable.eq).toHaveBeenCalledWith('user_id', activeStoreUser.id);
    expect(paymentsTable.eq).toHaveBeenCalledWith('paid', false);
    expect(paymentsTable.order).toHaveBeenNthCalledWith(1, 'reference_month', {
      ascending: false,
    });
    expect(paymentsTable.order).toHaveBeenNthCalledWith(2, 'due_date', { ascending: true });
    expect(paymentsTable.order).toHaveBeenNthCalledWith(3, 'id', { ascending: true });
    expect(paymentsTable.range).toHaveBeenCalledWith(10, 19);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: adminPaymentRow.id,
            reference_month: adminPaymentRow.reference_month,
            due_date: adminPaymentRow.due_date,
            paid: false,
            paid_at: null,
            created_at: adminPaymentRow.created_at,
            updated_at: adminPaymentRow.updated_at,
          },
        ],
        pagination: { page: 2, limit: 10, total: 1 },
      },
      message: 'Pagamentos administrativos do usuario encontrados',
    });

    const serializedData = JSON.stringify(response.body.data);
    expect(serializedData).not.toContain('user_id');
    expect(serializedData).not.toContain('auth_id');
    expect(serializedData).not.toContain('email');
    expect(serializedData).not.toContain('owner_name');
    expect(serializedData).not.toContain('full_name');
    expect(serializedData).not.toContain('marked_by');
    expect(serializedData).not.toContain('amount');
    expect(serializedData).not.toContain('payment_method');
    expect(serializedData).not.toContain('receipt');
    expect(serializedData).not.toContain('users');
  });

  it('returns an honest empty list for admin target users without reading payments', async () => {
    mockAuthUser();
    const usersTable = mockAdminUserPaymentTables({
      targetUser: { data: activeAdmin, error: null },
    });

    const response = await request(app)
      .get(`/api/admin/users/${activeAdmin.id}/payments?page=2&limit=10`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [],
        pagination: { page: 2, limit: 10, total: 0 },
      },
      message: 'Pagamentos administrativos do usuario encontrados',
    });
    expect(usersTable.select).toHaveBeenCalledWith('id,role');
    expect(supabaseMock.from).not.toHaveBeenCalledWith('payments');
  });

  it.each([
    '/api/admin/users/not-a-uuid/payments',
    `${storeUserPaymentsPath}?user_id=${activeStoreUser.id}`,
    `${storeUserPaymentsPath}?referenceMonth=2026-05`,
    `${storeUserPaymentsPath}?role=logista`,
    `${storeUserPaymentsPath}?userStatus=ativo`,
    `${storeUserPaymentsPath}?status=pendente`,
    `${storeUserPaymentsPath}?email=store@example.com`,
    `${storeUserPaymentsPath}?amount=100`,
    `${storeUserPaymentsPath}?paymentMethod=pix`,
    `${storeUserPaymentsPath}?pix=1`,
    `${storeUserPaymentsPath}?card=1`,
    `${storeUserPaymentsPath}?receipt=1`,
    `${storeUserPaymentsPath}?marked_by=${activeAdmin.id}`,
    `${storeUserPaymentsPath}?limit=51`,
  ])('rejects invalid params or query before reading target payments: %s', async (path) => {
    mockAuthUser();
    const paymentsTable = createAdminPaymentsListTable({
      rows: [],
      count: 0,
    });
    mockAdminUserPaymentTables({
      targetUser: { data: activeStoreUser, error: null },
      paymentsTable,
    });

    const response = await request(app)
      .get(path)
      .set('Authorization', 'Bearer admin-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(paymentsTable.select).not.toHaveBeenCalled();
  });

  it('returns USER_NOT_FOUND for a missing target user without reading payments', async () => {
    mockAuthUser();
    const paymentsTable = createAdminPaymentsListTable({
      rows: [],
      count: 0,
    });
    mockAdminUserPaymentTables({
      targetUser: notFoundResult,
      paymentsTable,
    });

    const response = await request(app)
      .get('/api/admin/users/ffffffff-ffff-4fff-8fff-ffffffffffff/payments')
      .set('Authorization', 'Bearer admin-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'USER_NOT_FOUND' },
    });
    expect(paymentsTable.select).not.toHaveBeenCalled();
  });

  it('returns a standardized failure when the target user payment query fails', async () => {
    mockAuthUser();
    const paymentsTable = createAdminPaymentsListTable({
      rows: null,
      count: null,
      error: { message: 'db down' },
    });
    mockAdminUserPaymentTables({
      targetUser: { data: activeStoreUser, error: null },
      paymentsTable,
    });

    const response = await request(app)
      .get(storeUserPaymentsPath)
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_USER_PAYMENTS_LIST_FAILED' },
    });
  });
});

describe('admin payments route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects the payment list without a bearer token', async () => {
    const response = await request(app).get('/api/admin/payments').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects the payment list for authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createSelectTableByColumn({
        auth_id: {
          data: activeStoreUser,
          error: null,
        },
      }),
    );

    const response = await request(app)
      .get('/api/admin/payments')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingAdmin, 'auth-pending-admin', 'USER_PENDING'],
    [blockedAdmin, 'auth-blocked-admin', 'USER_BLOCKED'],
  ])(
    'rejects the payment list for admin users with status %s',
    async (domainUser, authId, code) => {
      mockAuthUser(authId);
      supabaseMock.from.mockReturnValue(
        createSelectTableByColumn({
          auth_id: {
            data: domainUser,
            error: null,
          },
        }),
      );

      const response = await request(app)
        .get('/api/admin/payments')
        .set('Authorization', 'Bearer admin-token')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: { code },
      });
    },
  );

  it('lists pending payments with strict filters and a sanitized user summary', async () => {
    mockAuthUser();
    const paymentsTable = createAdminPaymentsListTable({
      rows: [adminPaymentRow],
      count: 1,
    });
    mockAdminPaymentTables(activeAdmin, [paymentsTable]);

    const response = await request(app)
      .get('/api/admin/payments?referenceMonth=2026-05&role=logista&userStatus=ativo')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(paymentsTable.select).toHaveBeenCalledWith(
      'id,reference_month,due_date,paid,paid_at,created_at,updated_at,users!payments_user_id_fkey!inner(role,status,stores(name))',
      { count: 'exact' },
    );
    expect(paymentsTable.eq).toHaveBeenCalledWith('paid', false);
    expect(paymentsTable.eq).toHaveBeenCalledWith('reference_month', '2026-05');
    expect(paymentsTable.eq).toHaveBeenCalledWith('users.status', 'ativo');
    expect(paymentsTable.in).toHaveBeenCalledWith('users.role', ['logista']);
    expect(paymentsTable.order).toHaveBeenNthCalledWith(1, 'reference_month', {
      ascending: false,
    });
    expect(paymentsTable.order).toHaveBeenNthCalledWith(2, 'due_date', { ascending: true });
    expect(paymentsTable.order).toHaveBeenNthCalledWith(3, 'id', { ascending: true });
    expect(paymentsTable.range).toHaveBeenCalledWith(0, 19);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: adminPaymentRow.id,
            reference_month: adminPaymentRow.reference_month,
            due_date: adminPaymentRow.due_date,
            paid: false,
            paid_at: null,
            created_at: adminPaymentRow.created_at,
            updated_at: adminPaymentRow.updated_at,
            user: {
              role: 'logista',
              status: 'ativo',
              store_name: storeProfile.name,
            },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
      message: 'Pagamentos administrativos encontrados',
    });

    const serializedData = JSON.stringify(response.body.data);
    expect(serializedData).not.toContain('user_id');
    expect(serializedData).not.toContain('auth_id');
    expect(serializedData).not.toContain('email');
    expect(serializedData).not.toContain('owner_name');
    expect(serializedData).not.toContain('full_name');
    expect(serializedData).not.toContain('marked_by');
    expect(serializedData).not.toContain('receipt');
    expect(serializedData).not.toContain('payment_method');
    expect(serializedData).not.toContain('amount');
  });

  it.each(['limit=51', 'status=pendente', 'user_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'])(
    'rejects invalid or unknown payment query parameters: %s',
    async (queryString) => {
      mockAuthUser();
      const paymentsTable = createAdminPaymentsListTable({
        rows: [],
        count: 0,
      });
      mockAdminPaymentTables(activeAdmin, [paymentsTable]);

      const response = await request(app)
        .get(`/api/admin/payments?${queryString}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
      expect(paymentsTable.select).not.toHaveBeenCalled();
    },
  );

  it('returns a standardized failure when the payment list query fails', async () => {
    mockAuthUser();
    const paymentsTable = createAdminPaymentsListTable({
      rows: null,
      count: null,
      error: { message: 'db down' },
    });
    mockAdminPaymentTables(activeAdmin, [paymentsTable]);

    const response = await request(app)
      .get('/api/admin/payments')
      .set('Authorization', 'Bearer admin-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_PAYMENTS_LIST_FAILED' },
    });
  });

  it('marks an unpaid payment as paid with server-side audit fields', async () => {
    mockAuthUser();
    const updateTable = createAdminPaymentUpdateTable({
      row: paidAdminPaymentRow,
    });
    mockAdminPaymentTables(activeAdmin, [updateTable]);

    const response = await request(app)
      .patch(`/api/admin/payments/${adminPaymentRow.id}/mark-paid`)
      .set('Authorization', 'Bearer admin-token')
      .send({})
      .expect(200);

    expect(updateTable.update).toHaveBeenCalledWith({
      paid: true,
      paid_at: 'now',
      marked_by: activeAdmin.id,
    });
    expect(updateTable.eq).toHaveBeenNthCalledWith(1, 'id', adminPaymentRow.id);
    expect(updateTable.eq).toHaveBeenNthCalledWith(2, 'paid', false);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: adminPaymentRow.id,
        paid: true,
        paid_at: paidAdminPaymentRow.paid_at,
        user: {
          role: 'logista',
          status: 'ativo',
          store_name: storeProfile.name,
        },
      },
      message: 'Pagamento marcado como pago',
    });
    expect(JSON.stringify(response.body.data)).not.toContain('marked_by');
  });

  it('is idempotent when the payment is already paid and preserves original audit fields', async () => {
    mockAuthUser();
    const updateTable = createAdminPaymentUpdateTable({ row: null });
    const detailTable = createAdminPaymentDetailTable({ row: paidAdminPaymentRow });
    mockAdminPaymentTables(activeAdmin, [updateTable, detailTable]);

    const response = await request(app)
      .patch(`/api/admin/payments/${adminPaymentRow.id}/mark-paid`)
      .set('Authorization', 'Bearer admin-token')
      .send({})
      .expect(200);

    expect(updateTable.update).toHaveBeenCalledWith({
      paid: true,
      paid_at: 'now',
      marked_by: activeAdmin.id,
    });
    expect(detailTable.select).toHaveBeenCalledWith(
      'id,reference_month,due_date,paid,paid_at,created_at,updated_at,users!payments_user_id_fkey!inner(role,status,stores(name))',
    );
    expect(response.body.data.paid).toBe(true);
    expect(response.body.data.paid_at).toBe(paidAdminPaymentRow.paid_at);
    expect(JSON.stringify(response.body.data)).not.toContain(activeAdmin.id);
  });

  it.each([
    ['amount', { amount: 100 }],
    ['paymentMethod', { paymentMethod: 'pix' }],
    ['paid_at', { paid_at: '2026-05-17T12:00:00.000Z' }],
    ['marked_by', { marked_by: activeAdmin.id }],
  ])('rejects forbidden mark-paid body field: %s', async (_field, body) => {
    mockAuthUser();
    const updateTable = createAdminPaymentUpdateTable({ row: paidAdminPaymentRow });
    mockAdminPaymentTables(activeAdmin, [updateTable]);

    const response = await request(app)
      .patch(`/api/admin/payments/${adminPaymentRow.id}/mark-paid`)
      .set('Authorization', 'Bearer admin-token')
      .send(body)
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(updateTable.update).not.toHaveBeenCalled();
  });

  it('returns PAYMENT_NOT_FOUND when marking a missing payment as paid', async () => {
    mockAuthUser();
    const updateTable = createAdminPaymentUpdateTable({ row: null });
    const detailTable = createAdminPaymentDetailTable({ row: null });
    mockAdminPaymentTables(activeAdmin, [updateTable, detailTable]);

    const response = await request(app)
      .patch('/api/admin/payments/ffffffff-ffff-4fff-8fff-ffffffffffff/mark-paid')
      .set('Authorization', 'Bearer admin-token')
      .send({})
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'PAYMENT_NOT_FOUND' },
    });
  });
});

describe('admin users list route', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects the list without a bearer token', async () => {
    const response = await request(app).get('/api/admin/users').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects the list for authenticated non-admin users', async () => {
    mockAuthUser('auth-store');
    supabaseMock.from.mockReturnValue(
      createAdminUsersListTable({ authUser: activeStoreUser, rows: [], count: 0 }),
    );

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it('returns store_name only for logista rows and never leaks the embed', async () => {
    mockAuthUser();
    const table = createAdminUsersListTable({
      authUser: activeAdmin,
      rows: [
        { ...activeStoreUser, stores: { name: storeProfile.name } },
        { ...activeAdmin, stores: null },
        { ...activeCourierUser, stores: [] },
      ],
      count: 3,
    });
    supabaseMock.from.mockReturnValue(table);

    const response = await request(app)
      .get('/api/admin/users?page=1&limit=20')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(table.select).toHaveBeenCalledWith(
      'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at,stores(name)',
      { count: 'exact' },
    );

    expect(response.body).toMatchObject({
      success: true,
      data: {
        items: [
          { ...activeStoreUser, store_name: storeProfile.name },
          { ...activeAdmin, store_name: null },
          { ...activeCourierUser, store_name: null },
        ],
        pagination: { page: 1, limit: 20, total: 3 },
      },
      message: 'Usuarios encontrados',
    });

    for (const item of response.body.data.items) {
      expect(item).not.toHaveProperty('stores');
      expect(item).not.toHaveProperty('logo_url');
      expect(item).toHaveProperty('store_name');
    }
  });
});
