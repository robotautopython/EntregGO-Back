import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeliveryRequest, DomainUser } from '../src/types/domain.js';

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

const activeStoreUser: DomainUser = {
  id: '11111111-1111-4111-8111-111111111111',
  auth_id: 'auth-store',
  email: 'store@example.com',
  role: 'logista',
  status: 'ativo',
  approved_at: '2026-05-14T00:00:00.000Z',
  approved_by: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const pendingStoreUser: DomainUser = {
  ...activeStoreUser,
  id: '22222222-2222-4222-8222-222222222222',
  auth_id: 'auth-pending-store',
  status: 'pendente',
  approved_at: null,
  approved_by: null,
};

const blockedStoreUser: DomainUser = {
  ...activeStoreUser,
  id: '33333333-3333-4333-8333-333333333333',
  auth_id: 'auth-blocked-store',
  status: 'bloqueado',
};

const activeCourierUser: DomainUser = {
  ...activeStoreUser,
  id: '44444444-4444-4444-8444-444444444444',
  auth_id: 'auth-courier',
  email: 'courier@example.com',
  role: 'motoboy',
};

const pendingCourierUser: DomainUser = {
  ...activeCourierUser,
  id: '44444444-4444-4444-8444-555555555555',
  auth_id: 'auth-pending-courier',
  status: 'pendente',
  approved_at: null,
  approved_by: null,
};

const blockedCourierUser: DomainUser = {
  ...activeCourierUser,
  id: '44444444-4444-4444-8444-666666666666',
  auth_id: 'auth-blocked-courier',
  status: 'bloqueado',
};

const secondActiveCourierUser: DomainUser = {
  ...activeCourierUser,
  id: '44444444-4444-4444-8444-777777777777',
  auth_id: 'auth-second-courier',
  email: 'second-courier@example.com',
};

const storeProfile = {
  id: '55555555-5555-4555-8555-555555555555',
  user_id: activeStoreUser.id,
};

const courierProfile = {
  id: '99999999-9999-4999-8999-999999999999',
  user_id: activeCourierUser.id,
  is_online: true,
};

const offlineCourierProfile = {
  ...courierProfile,
  id: '99999999-9999-4999-8999-aaaaaaaaaaaa',
  is_online: false,
};

const secondCourierProfile = {
  ...courierProfile,
  id: '99999999-9999-4999-8999-bbbbbbbbbbbb',
  user_id: secondActiveCourierUser.id,
};

const deliveryRequest: DeliveryRequest = {
  id: '66666666-6666-4666-8666-666666666666',
  store_id: storeProfile.id,
  destination_address: 'Rua Destino, 456',
  notes: 'Entregar na portaria',
  status: 'aguardando',
  courier_id: null,
  created_at: '2026-05-15T20:00:00.000Z',
  expires_at: '2026-05-15T20:01:00.000Z',
  accepted_at: null,
  collected_at: null,
  in_transit_at: null,
  delivered_at: null,
  updated_at: '2026-05-15T20:00:00.000Z',
};

const deliveryRequestWithoutDestination: DeliveryRequest = {
  ...deliveryRequest,
  destination_address: null,
};

const notFoundResult = {
  data: null,
  error: {
    message: 'not found',
  },
};

const createSelectSingleTable = (result: unknown) => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(result),
    })),
  })),
});

const createInsertSingleTable = (result: unknown) => ({
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(result),
    })),
  })),
});

const createDeliveryListTable = (result: {
  data: unknown;
  error: unknown;
  count: number | null;
}) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn().mockResolvedValue(result),
  };

  return builder;
};

const createAvailableDeliveryListTable = (result: {
  data: unknown;
  error: unknown;
  count: number | null;
}) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn().mockResolvedValue(result),
  };

  return builder;
};

const createAcceptDeliveryTable = ({
  updateResult,
  currentResult,
}: {
  updateResult: { data: unknown; error: unknown };
  currentResult?: { data: unknown; error: unknown };
}) => {
  const updateBuilder = {
    eq: vi.fn(() => updateBuilder),
    is: vi.fn(() => updateBuilder),
    gt: vi.fn(() => updateBuilder),
    select: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue(updateResult),
    })),
  };

  const currentBuilder = {
    eq: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue(
        currentResult ?? {
          data: null,
          error: null,
        },
      ),
    })),
  };

  return {
    update: vi.fn(() => updateBuilder),
    select: vi.fn(() => currentBuilder),
    updateBuilder,
    currentBuilder,
  };
};

const createActiveDeliveryTable = (result: { data: unknown; error: unknown }) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue(result),
    })),
  };

  return builder;
};

const mockAuthenticatedUser = (domainUser: DomainUser, tables: Record<string, unknown> = {}) => {
  supabaseMock.getUser.mockResolvedValue({
    data: {
      user: {
        id: domainUser.auth_id,
      },
    },
    error: null,
  });

  const usersTable = createSelectSingleTable({
    data: domainUser,
    error: null,
  });

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') {
      return usersTable;
    }

    return tables[table] ?? createSelectSingleTable(notFoundResult);
  });

  return usersTable;
};

const validPayload = {
  destinationAddress: 'Rua Destino, 456',
  notes: 'Entregar na portaria',
};

describe('M-04A delivery routes', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects delivery creation without a bearer token', async () => {
    const response = await request(app).post('/api/deliveries').send(validPayload).expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
      },
    });
  });

  it.each([
    [pendingStoreUser, 'USER_PENDING'],
    [blockedStoreUser, 'USER_BLOCKED'],
  ])('rejects delivery creation for store users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send(validPayload)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code,
      },
    });
  });

  it('rejects delivery creation from active couriers', async () => {
    mockAuthenticatedUser(activeCourierUser);

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer courier-token')
      .send(validPayload)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN_ROLE',
      },
    });
  });

  it('rejects invalid delivery creation payloads from active stores', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send({
        notes: 'x'.repeat(501),
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it.each([
    { store_id: '99999999-9999-4999-8999-999999999999' },
    { status: 'aceita' },
    { courier_id: '88888888-8888-4888-8888-888888888888' },
  ])('rejects derived delivery fields from the request body: %s', async (derivedField) => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: deliveryRequest,
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: deliveryRequestsTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send({
        ...validPayload,
        ...derivedField,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
    expect(storesTable.select).not.toHaveBeenCalled();
    expect(deliveryRequestsTable.insert).not.toHaveBeenCalled();
  });

  it('returns a standardized error when the active store has no store profile', async () => {
    const storesTable = createSelectSingleTable(notFoundResult);
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send(validPayload)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'STORE_PROFILE_REQUIRED',
      },
    });
  });

  it('creates a waiting delivery request for active stores using the authenticated store profile', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: deliveryRequest,
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: deliveryRequestsTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send(validPayload)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: deliveryRequest,
      message: 'Solicitacao de entrega criada',
    });

    expect(deliveryRequestsTable.insert).toHaveBeenCalledWith({
      store_id: storeProfile.id,
      destination_address: validPayload.destinationAddress,
      notes: validPayload.notes,
    });
    expect(response.body.data).not.toHaveProperty('email');
    expect(response.body.data).not.toHaveProperty('owner_name');
    expect(response.body.data).not.toHaveProperty('full_name');
    expect(response.body.data).not.toHaveProperty('logo_url');
    expect(response.body.data.status).toBe('aguardando');
    expect(response.body.data.courier_id).toBeNull();
  });

  it('creates a waiting delivery request with only notes and persists null destination', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: {
        ...deliveryRequestWithoutDestination,
        notes: 'Entregar no caixa',
      },
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: deliveryRequestsTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send({
        notes: '  Entregar no caixa  ',
      })
      .expect(201);

    expect(response.body.data.destination_address).toBeNull();
    expect(response.body.data.notes).toBe('Entregar no caixa');
    expect(deliveryRequestsTable.insert).toHaveBeenCalledWith({
      store_id: storeProfile.id,
      destination_address: null,
      notes: 'Entregar no caixa',
    });
  });

  it('creates a waiting delivery request from an empty payload', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: {
        ...deliveryRequestWithoutDestination,
        notes: null,
      },
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: deliveryRequestsTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send({})
      .expect(201);

    expect(response.body.data.destination_address).toBeNull();
    expect(response.body.data.notes).toBeNull();
    expect(deliveryRequestsTable.insert).toHaveBeenCalledWith({
      store_id: storeProfile.id,
      destination_address: null,
      notes: null,
    });
  });

  it('normalizes whitespace destination and notes to null', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: {
        ...deliveryRequestWithoutDestination,
        notes: null,
      },
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: deliveryRequestsTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send({
        destinationAddress: '   ',
        notes: '   ',
      })
      .expect(201);

    expect(response.body.data.destination_address).toBeNull();
    expect(response.body.data.notes).toBeNull();
    expect(deliveryRequestsTable.insert).toHaveBeenCalledWith({
      store_id: storeProfile.id,
      destination_address: null,
      notes: null,
    });
  });
});

const listRowEntregue = {
  id: '77777777-7777-4777-8777-777777777777',
  destination_address: 'Rua A, 1',
  notes: null,
  status: 'entregue',
  created_at: '2026-05-15T21:00:00.000Z',
  expires_at: '2026-05-15T21:01:00.000Z',
  accepted_at: '2026-05-15T21:00:30.000Z',
  collected_at: '2026-05-15T21:00:40.000Z',
  in_transit_at: '2026-05-15T21:00:50.000Z',
  delivered_at: '2026-05-15T21:05:00.000Z',
  updated_at: '2026-05-15T21:05:00.000Z',
};

const listRowAguardando = {
  id: '88888888-8888-4888-8888-888888888888',
  destination_address: null,
  notes: 'Sem endereco',
  status: 'aguardando',
  created_at: '2026-05-15T20:00:00.000Z',
  expires_at: '2026-05-15T20:01:00.000Z',
  accepted_at: null,
  collected_at: null,
  in_transit_at: null,
  delivered_at: null,
  updated_at: '2026-05-15T20:00:00.000Z',
};

describe('M-05 list store deliveries', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects listing without a bearer token', async () => {
    const response = await request(app).get('/api/deliveries').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it.each([
    [pendingStoreUser, 'USER_PENDING'],
    [blockedStoreUser, 'USER_BLOCKED'],
  ])('rejects listing for store users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .get('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('rejects listing from active couriers', async () => {
    mockAuthenticatedUser(activeCourierUser);

    const response = await request(app)
      .get('/api/deliveries')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it('returns STORE_PROFILE_REQUIRED when the active store has no store profile', async () => {
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable(notFoundResult),
    });

    const response = await request(app)
      .get('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'STORE_PROFILE_REQUIRED' },
    });
  });

  it('lists only deliveries scoped to the authenticated store, ordered and without identifiers', async () => {
    const deliveryListTable = createDeliveryListTable({
      data: [listRowEntregue, listRowAguardando],
      error: null,
      count: 2,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
      delivery_requests: deliveryListTable,
    });

    const response = await request(app)
      .get('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [listRowEntregue, listRowAguardando],
        pagination: { page: 1, limit: 20, total: 2 },
      },
      message: 'Entregas encontradas',
    });

    const selectArg = (deliveryListTable.select.mock.calls[0] as unknown[])[0] as string;
    expect(selectArg).not.toContain('store_id');
    expect(selectArg).not.toContain('courier_id');
    expect(deliveryListTable.eq).toHaveBeenCalledWith('store_id', storeProfile.id);
    expect(deliveryListTable.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(deliveryListTable.range).toHaveBeenCalledWith(0, 19);
    for (const item of response.body.data.items) {
      expect(item).not.toHaveProperty('store_id');
      expect(item).not.toHaveProperty('courier_id');
    }
  });

  it('applies the status filter and pagination range', async () => {
    const deliveryListTable = createDeliveryListTable({
      data: [listRowEntregue],
      error: null,
      count: 1,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
      delivery_requests: deliveryListTable,
    });

    await request(app)
      .get('/api/deliveries?status=entregue&page=2&limit=10')
      .set('Authorization', 'Bearer store-token')
      .expect(200);

    expect(deliveryListTable.eq).toHaveBeenCalledWith('store_id', storeProfile.id);
    expect(deliveryListTable.eq).toHaveBeenCalledWith('status', 'entregue');
    expect(deliveryListTable.range).toHaveBeenCalledWith(10, 19);
  });

  it('rejects an invalid status value', async () => {
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
    });

    const response = await request(app)
      .get('/api/deliveries?status=invalido')
      .set('Authorization', 'Bearer store-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects a limit above the maximum', async () => {
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
    });

    const response = await request(app)
      .get('/api/deliveries?limit=51')
      .set('Authorization', 'Bearer store-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it.each([
    'store_id=99999999-9999-4999-8999-999999999999',
    'courier_id=88888888-8888-4888-8888-888888888888',
    'user_id=11111111-1111-4111-8111-111111111111',
    'unknown=1',
  ])('rejects unknown query parameters: %s', async (queryString) => {
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
    });

    const response = await request(app)
      .get(`/api/deliveries?${queryString}`)
      .set('Authorization', 'Bearer store-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});

const storeSummary = {
  name: 'Loja Cafe',
  address: 'Rua da Loja, 100',
};

const availableDeliveryRow = {
  id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  status: 'aguardando',
  created_at: '2026-05-16T12:00:00.000Z',
  expires_at: '2099-05-16T12:01:00.000Z',
  stores: storeSummary,
  store_id: storeProfile.id,
  courier_id: null,
  destination_address: 'Rua Destino sigilosa',
  notes: 'Nao expor',
};

const acceptedDeliveryState = {
  id: deliveryRequest.id,
  status: 'aceita',
  courier_id: courierProfile.id,
  accepted_at: '2026-05-16T12:00:20.000Z',
  created_at: deliveryRequest.created_at,
  expires_at: '2099-05-16T12:01:00.000Z',
  stores: storeSummary,
  destination_address: 'Rua Destino sigilosa',
  notes: 'Nao expor',
};

const activeDeliveryState = {
  id: deliveryRequest.id,
  destination_address: 'Rua Destino sigilosa',
  notes: 'Entregar na portaria',
  status: 'aceita',
  accepted_at: '2026-05-16T12:00:20.000Z',
  created_at: deliveryRequest.created_at,
  expires_at: '2099-05-16T12:01:00.000Z',
  stores: storeSummary,
  store_id: storeProfile.id,
  courier_id: courierProfile.id,
  owner_name: 'Nao expor',
  logo_url: 'https://example.test/logo.png',
  description: 'Nao expor',
};

describe('Fatia 1 courier available deliveries', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects available listing from non-couriers', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .get('/api/deliveries/available')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingCourierUser, 'USER_PENDING'],
    [blockedCourierUser, 'USER_BLOCKED'],
  ])('rejects available listing for courier users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .get('/api/deliveries/available')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('requires a courier profile', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable(notFoundResult),
    });

    const response = await request(app)
      .get('/api/deliveries/available')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_PROFILE_REQUIRED' },
    });
  });

  it('requires the courier to be online', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: offlineCourierProfile,
        error: null,
      }),
    });

    const response = await request(app)
      .get('/api/deliveries/available')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_OFFLINE' },
    });
  });

  it('lists only available waiting deliveries with store embed and without restricted fields', async () => {
    const availableTable = createAvailableDeliveryListTable({
      data: [availableDeliveryRow],
      error: null,
      count: 1,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: availableTable,
    });

    const response = await request(app)
      .get('/api/deliveries/available?page=2&limit=10')
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: availableDeliveryRow.id,
            status: 'aguardando',
            created_at: availableDeliveryRow.created_at,
            expires_at: availableDeliveryRow.expires_at,
            store: storeSummary,
          },
        ],
        pagination: { page: 2, limit: 10, total: 1 },
      },
      message: 'Entregas disponiveis encontradas',
    });

    expect(availableTable.select).toHaveBeenCalledWith(
      'id,status,created_at,expires_at,stores(name,address)',
      { count: 'exact' },
    );
    expect(availableTable.eq).toHaveBeenCalledWith('status', 'aguardando');
    expect(availableTable.is).toHaveBeenCalledWith('courier_id', null);
    expect(availableTable.gt).toHaveBeenCalledWith('expires_at', 'now');
    expect(availableTable.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(availableTable.range).toHaveBeenCalledWith(10, 19);

    const item = response.body.data.items[0];
    expect(item).not.toHaveProperty('store_id');
    expect(item).not.toHaveProperty('courier_id');
    expect(item).not.toHaveProperty('destination_address');
    expect(item).not.toHaveProperty('notes');
    expect(item).not.toHaveProperty('owner_name');
    expect(item).not.toHaveProperty('logo_url');
    expect(item).not.toHaveProperty('description');
  });

  it('rejects unknown query parameters on available listing', async () => {
    const couriersTable = createSelectSingleTable({
      data: courierProfile,
      error: null,
    });
    const availableTable = createAvailableDeliveryListTable({
      data: [],
      error: null,
      count: 0,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: couriersTable,
      delivery_requests: availableTable,
    });

    const response = await request(app)
      .get('/api/deliveries/available?limit=20&store_id=forbidden')
      .set('Authorization', 'Bearer courier-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(couriersTable.select).not.toHaveBeenCalled();
    expect(availableTable.select).not.toHaveBeenCalled();
  });
});

describe('Fatia 2 courier active delivery', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects active delivery lookup without a bearer token', async () => {
    const response = await request(app).get('/api/deliveries/active').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects active delivery lookup from non-couriers', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .get('/api/deliveries/active')
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingCourierUser, 'USER_PENDING'],
    [blockedCourierUser, 'USER_BLOCKED'],
  ])(
    'rejects active delivery lookup for courier users with status %s',
    async (domainUser, code) => {
      mockAuthenticatedUser(domainUser);

      const response = await request(app)
        .get('/api/deliveries/active')
        .set('Authorization', 'Bearer courier-token')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: { code },
      });
    },
  );

  it('requires the courier to be online before active delivery lookup', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: offlineCourierProfile,
        error: null,
      }),
    });

    const response = await request(app)
      .get('/api/deliveries/active')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_OFFLINE' },
    });
  });

  it('returns a successful empty state when the courier has no active delivery', async () => {
    const activeTable = createActiveDeliveryTable({
      data: null,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: activeTable,
    });

    const response = await request(app)
      .get('/api/deliveries/active')
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: null,
      message: 'Nenhuma corrida ativa encontrada',
    });
    expect(activeTable.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(activeTable.eq).toHaveBeenCalledWith('status', 'aceita');
  });

  it('returns only the active delivery assigned to the authenticated courier', async () => {
    const activeTable = createActiveDeliveryTable({
      data: activeDeliveryState,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: activeTable,
    });

    const response = await request(app)
      .get('/api/deliveries/active')
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: activeDeliveryState.id,
        destination_address: activeDeliveryState.destination_address,
        notes: activeDeliveryState.notes,
        status: 'aceita',
        accepted_at: activeDeliveryState.accepted_at,
        created_at: activeDeliveryState.created_at,
        expires_at: activeDeliveryState.expires_at,
        store: storeSummary,
      },
      message: 'Corrida ativa encontrada',
    });

    expect(activeTable.select).toHaveBeenCalledWith(
      'id,destination_address,notes,status,accepted_at,created_at,expires_at,stores(name,address)',
    );
    expect(activeTable.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(activeTable.eq).toHaveBeenCalledWith('status', 'aceita');
    expect(activeTable.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(activeTable.limit).toHaveBeenCalledWith(1);
    expect(response.body.data).not.toHaveProperty('store_id');
    expect(response.body.data).not.toHaveProperty('courier_id');
    expect(response.body.data).not.toHaveProperty('owner_name');
    expect(response.body.data).not.toHaveProperty('logo_url');
    expect(response.body.data).not.toHaveProperty('description');
    expect(response.body.data).not.toHaveProperty('collected_at');
    expect(response.body.data).not.toHaveProperty('in_transit_at');
    expect(response.body.data).not.toHaveProperty('delivered_at');
  });

  it('rejects unknown query parameters on active delivery lookup', async () => {
    const couriersTable = createSelectSingleTable({
      data: courierProfile,
      error: null,
    });
    const activeTable = createActiveDeliveryTable({
      data: null,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: couriersTable,
      delivery_requests: activeTable,
    });

    const response = await request(app)
      .get('/api/deliveries/active?courier_id=forbidden')
      .set('Authorization', 'Bearer courier-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(couriersTable.select).not.toHaveBeenCalled();
    expect(activeTable.select).not.toHaveBeenCalled();
  });
});

describe('Fatia 1 courier delivery acceptance', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('atomically accepts a waiting delivery for an online courier', async () => {
    const acceptTable = createAcceptDeliveryTable({
      updateResult: {
        data: acceptedDeliveryState,
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: acceptTable,
    });

    const response = await request(app)
      .post(`/api/deliveries/${deliveryRequest.id}/accept`)
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: acceptedDeliveryState.id,
        status: 'aceita',
        courier_id: courierProfile.id,
        accepted_at: acceptedDeliveryState.accepted_at,
        created_at: acceptedDeliveryState.created_at,
        expires_at: acceptedDeliveryState.expires_at,
        store: storeSummary,
      },
      message: 'Entrega aceita',
    });

    expect(acceptTable.update).toHaveBeenCalledWith({
      status: 'aceita',
      courier_id: courierProfile.id,
      accepted_at: 'now',
    });
    expect(acceptTable.updateBuilder.eq).toHaveBeenCalledWith('id', deliveryRequest.id);
    expect(acceptTable.updateBuilder.eq).toHaveBeenCalledWith('status', 'aguardando');
    expect(acceptTable.updateBuilder.is).toHaveBeenCalledWith('courier_id', null);
    expect(acceptTable.updateBuilder.gt).toHaveBeenCalledWith('expires_at', 'now');
    expect(acceptTable.updateBuilder.select).toHaveBeenCalledWith(
      'id,status,courier_id,accepted_at,created_at,expires_at,stores(name,address)',
    );
    expect(acceptTable.select).not.toHaveBeenCalled();
    expect(response.body.data).not.toHaveProperty('destination_address');
    expect(response.body.data).not.toHaveProperty('notes');
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toEqual({
      event: 'delivery_accept',
      delivery_id: deliveryRequest.id,
      courier_id: courierProfile.id,
      result: 'accepted',
    });
  });

  it('returns one success and one ALREADY_ACCEPTED when two couriers race for the same delivery', async () => {
    const firstAcceptTable = createAcceptDeliveryTable({
      updateResult: {
        data: acceptedDeliveryState,
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: firstAcceptTable,
    });

    const firstResponse = await request(app)
      .post(`/api/deliveries/${deliveryRequest.id}/accept`)
      .set('Authorization', 'Bearer first-courier-token')
      .expect(200);

    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();

    const secondAcceptTable = createAcceptDeliveryTable({
      updateResult: {
        data: null,
        error: null,
      },
      currentResult: {
        data: acceptedDeliveryState,
        error: null,
      },
    });
    mockAuthenticatedUser(secondActiveCourierUser, {
      couriers: createSelectSingleTable({
        data: secondCourierProfile,
        error: null,
      }),
      delivery_requests: secondAcceptTable,
    });

    const secondResponse = await request(app)
      .post(`/api/deliveries/${deliveryRequest.id}/accept`)
      .set('Authorization', 'Bearer second-courier-token')
      .expect(409);

    const statuses = [firstResponse.status, secondResponse.status];
    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(1);
    expect(secondResponse.body).toMatchObject({
      success: false,
      error: { code: 'ALREADY_ACCEPTED' },
    });
  });

  it('returns the current state when the same courier accepts again', async () => {
    const acceptTable = createAcceptDeliveryTable({
      updateResult: {
        data: null,
        error: null,
      },
      currentResult: {
        data: acceptedDeliveryState,
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: acceptTable,
    });

    const response = await request(app)
      .post(`/api/deliveries/${deliveryRequest.id}/accept`)
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: deliveryRequest.id,
        status: 'aceita',
        courier_id: courierProfile.id,
      },
    });
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toMatchObject({
      result: 'idempotent',
    });
  });

  it('returns DELIVERY_NOT_FOUND when the delivery does not exist', async () => {
    const acceptTable = createAcceptDeliveryTable({
      updateResult: {
        data: null,
        error: null,
      },
      currentResult: {
        data: null,
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: acceptTable,
    });

    const response = await request(app)
      .post('/api/deliveries/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/accept')
      .set('Authorization', 'Bearer courier-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_NOT_FOUND' },
    });
  });

  it('returns DELIVERY_EXPIRED when the delivery is still waiting but expired', async () => {
    const acceptTable = createAcceptDeliveryTable({
      updateResult: {
        data: null,
        error: null,
      },
      currentResult: {
        data: {
          ...acceptedDeliveryState,
          status: 'aguardando',
          courier_id: null,
          accepted_at: null,
          expires_at: '2020-05-16T12:01:00.000Z',
        },
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: acceptTable,
    });

    const response = await request(app)
      .post(`/api/deliveries/${deliveryRequest.id}/accept`)
      .set('Authorization', 'Bearer courier-token')
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_EXPIRED' },
    });
  });

  it('requires courier profile and online status before accepting', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: offlineCourierProfile,
        error: null,
      }),
    });

    const response = await request(app)
      .post(`/api/deliveries/${deliveryRequest.id}/accept`)
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_OFFLINE' },
    });
  });
});
