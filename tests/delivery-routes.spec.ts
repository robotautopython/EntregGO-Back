import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const storeProfile = {
  id: '55555555-5555-4555-8555-555555555555',
  user_id: activeStoreUser.id,
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

const mockAuthenticatedUser = (
  domainUser: DomainUser,
  tables: Record<
    string,
    ReturnType<typeof createSelectSingleTable> | ReturnType<typeof createInsertSingleTable>
  > = {},
) => {
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
