import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeliveryRequest, DomainUser } from '../src/types/domain.js';

const supabaseMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

const realtimeBroadcastMock = vi.hoisted(() => ({
  broadcastDeliveryCreated: vi.fn(),
  broadcastDeliveryAccepted: vi.fn(),
  broadcastDeliveryStatusChanged: vi.fn(),
}));

vi.mock('../src/config/supabase.js', () => ({
  getSupabaseAdminClient: () => ({
    auth: {
      getUser: supabaseMock.getUser,
    },
    from: supabaseMock.from,
  }),
}));

vi.mock('../src/services/realtime-broadcast.service.js', () => realtimeBroadcastMock);

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

const storeSummary = {
  name: 'Loja Cafe',
  address: 'Rua da Loja, 100',
};

const courierProfile = {
  id: '99999999-9999-4999-8999-999999999999',
  user_id: activeCourierUser.id,
  is_online: true,
};

const courierSummary = {
  full_name: 'Motoboy Teste',
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

const createInsertSingleTable = (result: unknown) => {
  const singleBuilder = {
    single: vi.fn().mockResolvedValue(result),
  };
  const insertBuilder = {
    select: vi.fn(() => singleBuilder),
  };

  return {
    insert: vi.fn(() => insertBuilder),
    insertBuilder,
    singleBuilder,
  };
};

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

const createDeliveryDetailTable = (result: { data: unknown; error: unknown }) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue(result),
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
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue(result),
    })),
  };

  return builder;
};

const createStatusUpdateDeliveryTable = ({
  updateResult,
  currentResult,
}: {
  updateResult: { data: unknown; error: unknown };
  currentResult?: { data: unknown; error: unknown };
}) => {
  const updateBuilder = {
    eq: vi.fn(() => updateBuilder),
    select: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue(updateResult),
    })),
  };

  const currentBuilder = {
    eq: vi.fn(() => currentBuilder),
    maybeSingle: vi.fn().mockResolvedValue(
      currentResult ?? {
        data: null,
        error: null,
      },
    ),
  };

  return {
    update: vi.fn(() => updateBuilder),
    select: vi.fn(() => currentBuilder),
    updateBuilder,
    currentBuilder,
  };
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

beforeEach(() => {
  realtimeBroadcastMock.broadcastDeliveryCreated.mockReset();
  realtimeBroadcastMock.broadcastDeliveryAccepted.mockReset();
  realtimeBroadcastMock.broadcastDeliveryStatusChanged.mockReset();
});

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
      data: { ...deliveryRequest, stores: storeSummary },
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

  it('does not broadcast when delivery creation fails', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: null,
      error: { message: 'db down' },
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: deliveryRequestsTable,
    });

    const response = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer store-token')
      .send(validPayload)
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_CREATE_FAILED' },
    });
    expect(realtimeBroadcastMock.broadcastDeliveryCreated).not.toHaveBeenCalled();
  });

  it('creates a waiting delivery request for active stores using the authenticated store profile', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: { ...deliveryRequest, stores: storeSummary },
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
      data: {
        id: deliveryRequest.id,
        destination_address: deliveryRequest.destination_address,
        notes: deliveryRequest.notes,
        status: deliveryRequest.status,
        created_at: deliveryRequest.created_at,
        expires_at: deliveryRequest.expires_at,
        accepted_at: deliveryRequest.accepted_at,
        collected_at: deliveryRequest.collected_at,
        in_transit_at: deliveryRequest.in_transit_at,
        delivered_at: deliveryRequest.delivered_at,
        updated_at: deliveryRequest.updated_at,
        store: storeSummary,
        courier: null,
      },
      message: 'Solicitacao de entrega criada',
    });

    expect(deliveryRequestsTable.insert).toHaveBeenCalledWith({
      store_id: storeProfile.id,
      destination_address: validPayload.destinationAddress,
      notes: validPayload.notes,
    });
    const selectArg = (
      deliveryRequestsTable.insertBuilder.select.mock.calls[0] as unknown[]
    )[0] as string;
    expect(selectArg).not.toContain('store_id');
    expect(selectArg).not.toContain('courier_id');
    expect(selectArg).toContain('stores(name,address)');
    expect(selectArg).toContain('couriers(full_name)');
    expect(selectArg).not.toMatch(
      /couriers\(\*|couriers\(id|user_id|is_online|bike_photo_url|license_photo_url/i,
    );
    expect(response.body.data).not.toHaveProperty('email');
    expect(response.body.data).not.toHaveProperty('store_id');
    expect(response.body.data).not.toHaveProperty('courier_id');
    expect(response.body.data).not.toHaveProperty('owner_name');
    expect(response.body.data).not.toHaveProperty('full_name');
    expect(response.body.data).not.toHaveProperty('logo_url');
    expect(response.body.data).not.toHaveProperty('description');
    expect(JSON.stringify(response.body.data)).not.toMatch(
      /store_id|courier_id|user_id|auth_id|email|owner_name|logo_url|description|is_online|bike_photo_url|license_photo_url|Authorization|Bearer|service_role|token/i,
    );
    expect(response.body.data.status).toBe('aguardando');
    expect(response.body.data.courier).toBeNull();
    expect(realtimeBroadcastMock.broadcastDeliveryCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: deliveryRequest.id,
        status: deliveryRequest.status,
        updated_at: deliveryRequest.updated_at,
      }),
    );
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
        stores: storeSummary,
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
    expect(realtimeBroadcastMock.broadcastDeliveryCreated).toHaveBeenCalledTimes(1);
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
        stores: storeSummary,
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

  it('keeps the REST creation success when broadcast dispatch rejects', async () => {
    realtimeBroadcastMock.broadcastDeliveryCreated.mockRejectedValueOnce(
      new Error('realtime down'),
    );
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const deliveryRequestsTable = createInsertSingleTable({
      data: { ...deliveryRequest, stores: storeSummary },
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

    expect(response.body).toMatchObject({
      success: true,
      data: { id: deliveryRequest.id, status: 'aguardando' },
    });
    expect(realtimeBroadcastMock.broadcastDeliveryCreated).toHaveBeenCalledTimes(1);
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
        stores: storeSummary,
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

describe('M-06 get store delivery detail', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects detail lookup without a bearer token', async () => {
    const response = await request(app).get(`/api/deliveries/${listRowEntregue.id}`).expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it.each([
    [pendingStoreUser, 'USER_PENDING'],
    [blockedStoreUser, 'USER_BLOCKED'],
  ])('rejects detail lookup for store users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .get(`/api/deliveries/${listRowEntregue.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('rejects detail lookup from active couriers', async () => {
    mockAuthenticatedUser(activeCourierUser);

    const response = await request(app)
      .get(`/api/deliveries/${listRowEntregue.id}`)
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
      .get(`/api/deliveries/${listRowEntregue.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'STORE_PROFILE_REQUIRED' },
    });
  });

  it('returns a delivery only when it belongs to the authenticated store', async () => {
    const detailTable = createDeliveryDetailTable({
      data: { ...listRowEntregue, stores: storeSummary, couriers: courierSummary },
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
      delivery_requests: detailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/${listRowEntregue.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        ...listRowEntregue,
        store: storeSummary,
        courier: courierSummary,
      },
      message: 'Entrega encontrada',
    });

    const selectArg = (detailTable.select.mock.calls[0] as unknown[])[0] as string;
    expect(selectArg).not.toContain('store_id');
    expect(selectArg).not.toContain('courier_id');
    expect(selectArg).toContain('stores(name,address)');
    expect(selectArg).toContain('couriers(full_name)');
    expect(selectArg).not.toMatch(
      /couriers\(\*|couriers\(id|user_id|is_online|bike_photo_url|license_photo_url/i,
    );
    expect(detailTable.eq).toHaveBeenCalledWith('id', listRowEntregue.id);
    expect(detailTable.eq).toHaveBeenCalledWith('store_id', storeProfile.id);
    expect(response.body.data).not.toHaveProperty('store_id');
    expect(response.body.data).not.toHaveProperty('courier_id');
    expect(response.body.data).not.toHaveProperty('owner_name');
    expect(response.body.data).not.toHaveProperty('full_name');
    expect(response.body.data).not.toHaveProperty('logo_url');
    expect(response.body.data).not.toHaveProperty('description');
    expect(response.body.data).not.toHaveProperty('bike_photo_url');
    expect(response.body.data).not.toHaveProperty('license_photo_url');
    expect(JSON.stringify(response.body.data)).not.toMatch(
      /store_id|courier_id|user_id|auth_id|email|phone|owner_name|logo_url|description|is_online|bike_photo_url|license_photo_url|Authorization|Bearer|service_role|token/i,
    );
  });

  it('returns courier null for a store delivery that has not been accepted', async () => {
    const detailTable = createDeliveryDetailTable({
      data: { ...listRowAguardando, stores: storeSummary, couriers: courierSummary },
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
      delivery_requests: detailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/${listRowAguardando.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: listRowAguardando.id,
        status: 'aguardando',
        accepted_at: null,
        store: storeSummary,
        courier: null,
      },
    });
    expect(JSON.stringify(response.body.data)).not.toMatch(
      /courier_id|user_id|auth_id|email|phone|is_online|bike_photo_url|license_photo_url|Authorization|Bearer|service_role|token/i,
    );
  });

  it('returns DELIVERY_NOT_FOUND for a missing or other-store delivery', async () => {
    const detailTable = createDeliveryDetailTable({
      data: null,
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
      delivery_requests: detailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/${listRowEntregue.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_NOT_FOUND' },
    });
    expect(detailTable.eq).toHaveBeenCalledWith('id', listRowEntregue.id);
    expect(detailTable.eq).toHaveBeenCalledWith('store_id', storeProfile.id);
  });

  it('rejects invalid ids before touching store or delivery tables', async () => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const detailTable = createDeliveryDetailTable({
      data: listRowEntregue,
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: detailTable,
    });

    const response = await request(app)
      .get('/api/deliveries/not-a-uuid')
      .set('Authorization', 'Bearer store-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(storesTable.select).not.toHaveBeenCalled();
    expect(detailTable.select).not.toHaveBeenCalled();
  });

  it.each([
    'store_id=99999999-9999-4999-8999-999999999999',
    'courier_id=88888888-8888-4888-8888-888888888888',
    'user_id=11111111-1111-4111-8111-111111111111',
    'unknown=1',
  ])('rejects unknown detail query parameters: %s', async (queryString) => {
    const storesTable = createSelectSingleTable({
      data: storeProfile,
      error: null,
    });
    const detailTable = createDeliveryDetailTable({
      data: listRowEntregue,
      error: null,
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: storesTable,
      delivery_requests: detailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/${listRowEntregue.id}?${queryString}`)
      .set('Authorization', 'Bearer store-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(storesTable.select).not.toHaveBeenCalled();
    expect(detailTable.select).not.toHaveBeenCalled();
  });

  it('returns a standardized failure when the detail query fails', async () => {
    const detailTable = createDeliveryDetailTable({
      data: null,
      error: { message: 'db down' },
    });
    mockAuthenticatedUser(activeStoreUser, {
      stores: createSelectSingleTable({ data: storeProfile, error: null }),
      delivery_requests: detailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/${listRowEntregue.id}`)
      .set('Authorization', 'Bearer store-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_GET_FAILED' },
    });
  });
});

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
  updated_at: '2026-05-16T12:00:20.000Z',
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
  updated_at: '2026-05-16T12:00:20.000Z',
  stores: storeSummary,
  store_id: storeProfile.id,
  courier_id: courierProfile.id,
  owner_name: 'Nao expor',
  logo_url: 'https://example.test/logo.png',
  description: 'Nao expor',
};

const collectedDeliveryState = {
  ...activeDeliveryState,
  status: 'coletada',
};

const inTransitDeliveryState = {
  ...activeDeliveryState,
  status: 'em_transito',
};

const deliveredDeliveryState = {
  ...activeDeliveryState,
  status: 'entregue',
};

const historyDeliveredRow = {
  id: 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb',
  destination_address: 'Rua Historico, 10',
  notes: 'Entrega finalizada',
  status: 'entregue',
  created_at: '2026-05-16T14:00:00.000Z',
  expires_at: '2026-05-16T14:01:00.000Z',
  accepted_at: '2026-05-16T14:00:20.000Z',
  collected_at: '2026-05-16T14:02:00.000Z',
  in_transit_at: '2026-05-16T14:04:00.000Z',
  delivered_at: '2026-05-16T14:12:00.000Z',
  updated_at: '2026-05-16T14:12:00.000Z',
  stores: storeSummary,
  store_id: storeProfile.id,
  courier_id: courierProfile.id,
  owner_name: 'Nao expor',
  logo_url: 'https://example.test/logo.png',
  description: 'Nao expor',
};

const historyCollectedRow = {
  ...historyDeliveredRow,
  id: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
  status: 'coletada',
  destination_address: null,
  notes: null,
  delivered_at: null,
  stores: [storeSummary],
};

describe('Fatia 4B courier delivery history', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects history listing without a bearer token', async () => {
    const response = await request(app).get('/api/deliveries/history').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects history listing from non-couriers', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .get('/api/deliveries/history')
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
  ])('rejects history listing for courier users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .get('/api/deliveries/history')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('returns COURIER_PROFILE_REQUIRED when the active courier has no courier profile', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable(notFoundResult),
    });

    const response = await request(app)
      .get('/api/deliveries/history')
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_PROFILE_REQUIRED' },
    });
  });

  it('lists only deliveries assigned to the authenticated courier, even when offline', async () => {
    const historyTable = createDeliveryListTable({
      data: [historyDeliveredRow, historyCollectedRow],
      error: null,
      count: 2,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: offlineCourierProfile,
        error: null,
      }),
      delivery_requests: historyTable,
    });

    const response = await request(app)
      .get('/api/deliveries/history')
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: historyDeliveredRow.id,
            destination_address: historyDeliveredRow.destination_address,
            notes: historyDeliveredRow.notes,
            status: historyDeliveredRow.status,
            created_at: historyDeliveredRow.created_at,
            expires_at: historyDeliveredRow.expires_at,
            accepted_at: historyDeliveredRow.accepted_at,
            collected_at: historyDeliveredRow.collected_at,
            in_transit_at: historyDeliveredRow.in_transit_at,
            delivered_at: historyDeliveredRow.delivered_at,
            updated_at: historyDeliveredRow.updated_at,
            store: storeSummary,
          },
          {
            id: historyCollectedRow.id,
            destination_address: null,
            notes: null,
            status: historyCollectedRow.status,
            created_at: historyCollectedRow.created_at,
            expires_at: historyCollectedRow.expires_at,
            accepted_at: historyCollectedRow.accepted_at,
            collected_at: historyCollectedRow.collected_at,
            in_transit_at: historyCollectedRow.in_transit_at,
            delivered_at: null,
            updated_at: historyCollectedRow.updated_at,
            store: storeSummary,
          },
        ],
        pagination: { page: 1, limit: 20, total: 2 },
      },
      message: 'Historico de entregas encontrado',
    });

    expect(historyTable.eq).toHaveBeenCalledWith('courier_id', offlineCourierProfile.id);
    expect(historyTable.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(historyTable.range).toHaveBeenCalledWith(0, 19);
    const selectArg = (historyTable.select.mock.calls[0] as unknown[])[0] as string;
    expect(selectArg).not.toContain('store_id');
    expect(selectArg).not.toContain('courier_id');
    for (const item of response.body.data.items) {
      expect(item).not.toHaveProperty('store_id');
      expect(item).not.toHaveProperty('courier_id');
      expect(item).not.toHaveProperty('owner_name');
      expect(item).not.toHaveProperty('logo_url');
      expect(item).not.toHaveProperty('description');
    }
  });

  it('applies status filter and pagination range', async () => {
    const historyTable = createDeliveryListTable({
      data: [historyDeliveredRow],
      error: null,
      count: 1,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({ data: courierProfile, error: null }),
      delivery_requests: historyTable,
    });

    await request(app)
      .get('/api/deliveries/history?status=entregue&page=2&limit=10')
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(historyTable.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(historyTable.eq).toHaveBeenCalledWith('status', 'entregue');
    expect(historyTable.range).toHaveBeenCalledWith(10, 19);
  });

  it('rejects invalid history query values', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({ data: courierProfile, error: null }),
    });

    const response = await request(app)
      .get('/api/deliveries/history?limit=51&status=invalido')
      .set('Authorization', 'Bearer courier-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it.each([
    'store_id=55555555-5555-4555-8555-555555555555',
    'courier_id=99999999-9999-4999-8999-999999999999',
    'search=loja',
    'unknown=1',
  ])('rejects unknown history query parameters: %s', async (queryString) => {
    const couriersTable = createSelectSingleTable({
      data: courierProfile,
      error: null,
    });
    const historyTable = createDeliveryListTable({
      data: [],
      error: null,
      count: 0,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: couriersTable,
      delivery_requests: historyTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/history?${queryString}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(couriersTable.select).not.toHaveBeenCalled();
    expect(historyTable.select).not.toHaveBeenCalled();
  });

  it('returns a standardized failure when the history query fails', async () => {
    const historyTable = createDeliveryListTable({
      data: null,
      error: { message: 'db down' },
      count: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({ data: courierProfile, error: null }),
      delivery_requests: historyTable,
    });

    const response = await request(app)
      .get('/api/deliveries/history')
      .set('Authorization', 'Bearer courier-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_HISTORY_LIST_FAILED' },
    });
  });

  it('rejects history detail without a bearer token', async () => {
    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects history detail from non-couriers', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
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
  ])('rejects history detail for courier users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('returns COURIER_PROFILE_REQUIRED when the active courier detail has no profile', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable(notFoundResult),
    });

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_PROFILE_REQUIRED' },
    });
  });

  it('returns one history delivery assigned to the authenticated courier, even when offline', async () => {
    const historyDetailTable = createDeliveryDetailTable({
      data: historyDeliveredRow,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: offlineCourierProfile,
        error: null,
      }),
      delivery_requests: historyDetailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: historyDeliveredRow.id,
        destination_address: historyDeliveredRow.destination_address,
        notes: historyDeliveredRow.notes,
        status: historyDeliveredRow.status,
        created_at: historyDeliveredRow.created_at,
        expires_at: historyDeliveredRow.expires_at,
        accepted_at: historyDeliveredRow.accepted_at,
        collected_at: historyDeliveredRow.collected_at,
        in_transit_at: historyDeliveredRow.in_transit_at,
        delivered_at: historyDeliveredRow.delivered_at,
        updated_at: historyDeliveredRow.updated_at,
        store: storeSummary,
      },
      message: 'Entrega do historico encontrada',
    });

    expect(historyDetailTable.eq).toHaveBeenCalledWith('id', historyDeliveredRow.id);
    expect(historyDetailTable.eq).toHaveBeenCalledWith('courier_id', offlineCourierProfile.id);
    const selectArg = (historyDetailTable.select.mock.calls[0] as unknown[])[0] as string;
    expect(selectArg).not.toContain('store_id');
    expect(selectArg).not.toContain('courier_id');
    expect(response.body.data).not.toHaveProperty('store_id');
    expect(response.body.data).not.toHaveProperty('courier_id');
    expect(response.body.data).not.toHaveProperty('owner_name');
    expect(response.body.data).not.toHaveProperty('logo_url');
    expect(response.body.data).not.toHaveProperty('description');
  });

  it('returns DELIVERY_NOT_FOUND for another courier history detail', async () => {
    const historyDetailTable = createDeliveryDetailTable({
      data: null,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({ data: courierProfile, error: null }),
      delivery_requests: historyDetailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_NOT_FOUND' },
    });
    expect(historyDetailTable.eq).toHaveBeenCalledWith('id', historyDeliveredRow.id);
    expect(historyDetailTable.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
  });

  it.each([
    'courier_id=99999999-9999-4999-8999-999999999999',
    'store_id=55555555-5555-4555-8555-555555555555',
    'status=entregue',
    'page=1',
    'limit=20',
    'unknown=1',
  ])('rejects unknown history detail query parameters: %s', async (queryString) => {
    const couriersTable = createSelectSingleTable({
      data: courierProfile,
      error: null,
    });
    const historyDetailTable = createDeliveryDetailTable({
      data: historyDeliveredRow,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: couriersTable,
      delivery_requests: historyDetailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}?${queryString}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(couriersTable.select).not.toHaveBeenCalled();
    expect(historyDetailTable.select).not.toHaveBeenCalled();
  });

  it('rejects invalid history detail UUID', async () => {
    const couriersTable = createSelectSingleTable({
      data: courierProfile,
      error: null,
    });
    const historyDetailTable = createDeliveryDetailTable({
      data: historyDeliveredRow,
      error: null,
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: couriersTable,
      delivery_requests: historyDetailTable,
    });

    const response = await request(app)
      .get('/api/deliveries/history/not-a-uuid')
      .set('Authorization', 'Bearer courier-token')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(couriersTable.select).not.toHaveBeenCalled();
    expect(historyDetailTable.select).not.toHaveBeenCalled();
  });

  it('returns a standardized failure when the history detail query fails', async () => {
    const historyDetailTable = createDeliveryDetailTable({
      data: null,
      error: { message: 'db down' },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({ data: courierProfile, error: null }),
      delivery_requests: historyDetailTable,
    });

    const response = await request(app)
      .get(`/api/deliveries/history/${historyDeliveredRow.id}`)
      .set('Authorization', 'Bearer courier-token')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_HISTORY_GET_FAILED' },
    });
  });
});

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
    expect(activeTable.in).toHaveBeenCalledWith('status', ['aceita', 'coletada', 'em_transito']);
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
      'id,destination_address,notes,status,accepted_at,created_at,expires_at,updated_at,stores(name,address)',
    );
    expect(activeTable.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(activeTable.in).toHaveBeenCalledWith('status', ['aceita', 'coletada', 'em_transito']);
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

  it('keeps the active delivery status returned by the database', async () => {
    const activeTable = createActiveDeliveryTable({
      data: {
        ...activeDeliveryState,
        status: 'coletada',
      },
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

    expect(response.body.data.status).toBe('coletada');
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

describe('Fatia 4A courier delivery status transitions', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('rejects status transition without a bearer token', async () => {
    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .send({ status: 'coletada' })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects status transition from non-couriers', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer store-token')
      .send({ status: 'coletada' })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN_ROLE' },
    });
  });

  it.each([
    [pendingCourierUser, 'USER_PENDING'],
    [blockedCourierUser, 'USER_BLOCKED'],
  ])('rejects status transition for courier users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({ status: 'coletada' })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it('requires the courier to be online before status transition', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: offlineCourierProfile,
        error: null,
      }),
    });

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({ status: 'coletada' })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'COURIER_OFFLINE' },
    });
  });

  it.each([
    { courier_id: courierProfile.id },
    { store_id: storeProfile.id },
    { user_id: activeCourierUser.id },
    { is_online: true },
    { accepted_at: '2026-05-16T12:00:20.000Z' },
    { collected_at: '2026-05-16T12:01:00.000Z' },
    { in_transit_at: '2026-05-16T12:02:00.000Z' },
    { delivered_at: '2026-05-16T12:03:00.000Z' },
    { unknown: 'forbidden' },
  ])('rejects forbidden transition payload fields: %s', async (forbiddenField) => {
    const couriersTable = createSelectSingleTable({
      data: courierProfile,
      error: null,
    });
    const updateTable = createStatusUpdateDeliveryTable({
      updateResult: { data: collectedDeliveryState, error: null },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: couriersTable,
      delivery_requests: updateTable,
    });

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({
        status: 'coletada',
        ...forbiddenField,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(couriersTable.select).not.toHaveBeenCalled();
    expect(updateTable.update).not.toHaveBeenCalled();
  });

  it.each([
    ['coletada', 'aceita', 'collected_at', collectedDeliveryState],
    ['em_transito', 'coletada', 'in_transit_at', inTransitDeliveryState],
    ['entregue', 'em_transito', 'delivered_at', deliveredDeliveryState],
  ] as const)(
    'updates %s only from %s and returns a sanitized state',
    async (targetStatus, previousStatus, timestampColumn, returnedState) => {
      const updateTable = createStatusUpdateDeliveryTable({
        updateResult: {
          data: returnedState,
          error: null,
        },
      });
      mockAuthenticatedUser(activeCourierUser, {
        couriers: createSelectSingleTable({
          data: courierProfile,
          error: null,
        }),
        delivery_requests: updateTable,
      });

      const response = await request(app)
        .patch(`/api/deliveries/${deliveryRequest.id}/status`)
        .set('Authorization', 'Bearer courier-token')
        .send({ status: targetStatus })
        .expect(200);

      expect(updateTable.update).toHaveBeenCalledWith({
        status: targetStatus,
        [timestampColumn]: 'now',
      });
      expect(updateTable.updateBuilder.eq).toHaveBeenCalledWith('id', deliveryRequest.id);
      expect(updateTable.updateBuilder.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
      expect(updateTable.updateBuilder.eq).toHaveBeenCalledWith('status', previousStatus);
      expect(updateTable.updateBuilder.select).toHaveBeenCalledWith(
        'id,destination_address,notes,status,accepted_at,created_at,expires_at,updated_at,stores(name,address)',
      );
      expect(updateTable.select).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: deliveryRequest.id,
          status: targetStatus,
          destination_address: activeDeliveryState.destination_address,
          notes: activeDeliveryState.notes,
          store: storeSummary,
        },
        message: 'Status da entrega atualizado',
      });
      expect(response.body.data).not.toHaveProperty('store_id');
      expect(response.body.data).not.toHaveProperty('courier_id');
      expect(response.body.data).not.toHaveProperty('owner_name');
      expect(response.body.data).not.toHaveProperty('logo_url');
      expect(response.body.data).not.toHaveProperty('description');
      expect(response.body.data).not.toHaveProperty('collected_at');
      expect(response.body.data).not.toHaveProperty('in_transit_at');
      expect(response.body.data).not.toHaveProperty('delivered_at');
      expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toEqual({
        event: 'delivery_status_update',
        delivery_id: deliveryRequest.id,
        from_status: previousStatus,
        to_status: targetStatus,
        result: 'updated',
      });
      expect(realtimeBroadcastMock.broadcastDeliveryStatusChanged).toHaveBeenCalledWith(
        returnedState,
      );
    },
  );

  it('returns the current state when retrying the same status without overwriting timestamps', async () => {
    const updateTable = createStatusUpdateDeliveryTable({
      updateResult: {
        data: null,
        error: null,
      },
      currentResult: {
        data: collectedDeliveryState,
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: updateTable,
    });

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({ status: 'coletada' })
      .expect(200);

    expect(updateTable.updateBuilder.eq).toHaveBeenCalledWith('status', 'aceita');
    expect(updateTable.currentBuilder.eq).toHaveBeenCalledWith('id', deliveryRequest.id);
    expect(updateTable.currentBuilder.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(response.body.data.status).toBe('coletada');
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toMatchObject({
      result: 'idempotent',
      from_status: 'coletada',
      to_status: 'coletada',
    });
    expect(realtimeBroadcastMock.broadcastDeliveryStatusChanged).not.toHaveBeenCalled();
  });

  it('rejects invalid transition order', async () => {
    const updateTable = createStatusUpdateDeliveryTable({
      updateResult: {
        data: null,
        error: null,
      },
      currentResult: {
        data: activeDeliveryState,
        error: null,
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: updateTable,
    });

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({ status: 'entregue' })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'INVALID_DELIVERY_TRANSITION' },
    });
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toMatchObject({
      result: 'invalid_transition',
      from_status: 'aceita',
      to_status: 'entregue',
    });
    expect(realtimeBroadcastMock.broadcastDeliveryStatusChanged).not.toHaveBeenCalled();
  });

  it('returns DELIVERY_NOT_FOUND for missing or unassigned-to-this-courier deliveries', async () => {
    const updateTable = createStatusUpdateDeliveryTable({
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
      delivery_requests: updateTable,
    });

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({ status: 'coletada' })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_NOT_FOUND' },
    });
    expect(updateTable.currentBuilder.eq).toHaveBeenCalledWith('id', deliveryRequest.id);
    expect(updateTable.currentBuilder.eq).toHaveBeenCalledWith('courier_id', courierProfile.id);
    expect(realtimeBroadcastMock.broadcastDeliveryStatusChanged).not.toHaveBeenCalled();
  });

  it('returns a standardized failure when the conditional update fails', async () => {
    const updateTable = createStatusUpdateDeliveryTable({
      updateResult: {
        data: null,
        error: { message: 'db down' },
      },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable({
        data: courierProfile,
        error: null,
      }),
      delivery_requests: updateTable,
    });

    const response = await request(app)
      .patch(`/api/deliveries/${deliveryRequest.id}/status`)
      .set('Authorization', 'Bearer courier-token')
      .send({ status: 'coletada' })
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'DELIVERY_STATUS_UPDATE_FAILED' },
    });
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toEqual({
      event: 'delivery_status_update',
      delivery_id: deliveryRequest.id,
      from_status: 'aceita',
      to_status: 'coletada',
      result: 'failed',
    });
    expect(realtimeBroadcastMock.broadcastDeliveryStatusChanged).not.toHaveBeenCalled();
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
      'id,status,accepted_at,created_at,expires_at,updated_at,stores(name,address)',
    );
    expect(acceptTable.select).not.toHaveBeenCalled();
    expect(response.body.data).not.toHaveProperty('courier_id');
    expect(response.body.data).not.toHaveProperty('destination_address');
    expect(response.body.data).not.toHaveProperty('notes');
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toEqual({
      event: 'delivery_accept',
      delivery_id: deliveryRequest.id,
      result: 'accepted',
    });
    expect(realtimeBroadcastMock.broadcastDeliveryAccepted).toHaveBeenCalledWith(
      acceptedDeliveryState,
    );
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
      },
    });
    expect(response.body.data).not.toHaveProperty('courier_id');
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toMatchObject({
      result: 'idempotent',
    });
    expect(realtimeBroadcastMock.broadcastDeliveryAccepted).not.toHaveBeenCalled();
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
    expect(realtimeBroadcastMock.broadcastDeliveryAccepted).not.toHaveBeenCalled();
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
    expect(realtimeBroadcastMock.broadcastDeliveryAccepted).not.toHaveBeenCalled();
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
    expect(realtimeBroadcastMock.broadcastDeliveryAccepted).not.toHaveBeenCalled();
  });
});
