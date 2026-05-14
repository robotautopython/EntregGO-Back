import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(backendRoot, '..', 'EntregGO-Front');

dotenv.config({ path: path.join(backendRoot, '.env.local'), override: false, quiet: true });
dotenv.config({ path: path.join(backendRoot, '.env'), override: false, quiet: true });
dotenv.config({ path: path.join(frontendRoot, '.env.local'), override: false, quiet: true });
dotenv.config({ path: path.join(frontendRoot, '.env'), override: false, quiet: true });

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const domainUserSelect =
  'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at';
const storeSelect = 'id,user_id,name,owner_name,address,logo_url,description,created_at,updated_at';
const courierSelect =
  'id,user_id,full_name,bike_photo_url,license_photo_url,is_online,created_at,updated_at';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const logStep = (message) => {
  console.log(`[smoke-auth-rls] ${message}`);
};

const assertRequiredEnv = () => {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  assert(missing.length === 0, `Missing required env names: ${missing.join(', ')}`);
  assert(/^https?:\/\/.+/.test(process.env.SUPABASE_URL), 'SUPABASE_URL format invalid');
  assert(
    /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ) || process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_'),
    'SUPABASE_SERVICE_ROLE_KEY format invalid',
  );
  assert(
    /^https?:\/\/.+/.test(process.env.NEXT_PUBLIC_SUPABASE_URL),
    'NEXT_PUBLIC_SUPABASE_URL format invalid',
  );
};

const makePassword = (stamp) => `RlsSmoke!${stamp}Aa1`;

const makeEmail = (stamp, suffix) => `rls-smoke-${stamp}-${suffix}@example.test`;

const createSupabaseClients = () => {
  const service = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return { service, anon };
};

const createAuthUser = async (service, email, password, role) => {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  assert(!error && data.user, `Auth user creation failed for ${role}`);
  return data.user;
};

const createDomainUser = async (service, authUser, email, role, status, approvedBy = null) => {
  const payload = {
    auth_id: authUser.id,
    email,
    role,
    status,
    approved_at: status === 'ativo' ? new Date().toISOString() : null,
    approved_by: approvedBy,
  };

  const { data, error } = await service
    .from('users')
    .insert(payload)
    .select(domainUserSelect)
    .single();

  assert(!error && data, `Domain user creation failed for ${role}/${status}`);
  return data;
};

const createStore = async (service, userId, stamp) => {
  const { data, error } = await service
    .from('stores')
    .insert({
      user_id: userId,
      name: `Loja Ficticia RLS ${stamp}`,
      owner_name: 'Operador Ficticio',
      address: 'Rua Ficticia 123, Bairro Teste',
      description: 'Registro temporario de smoke RLS',
    })
    .select(storeSelect)
    .single();

  assert(!error && data, 'Store profile creation failed');
  return data;
};

const createCourier = async (service, userId, stamp, isOnline = false) => {
  const { data, error } = await service
    .from('couriers')
    .insert({
      user_id: userId,
      full_name: `Motoboy Ficticio RLS ${stamp}`,
      is_online: isOnline,
    })
    .select(courierSelect)
    .single();

  assert(!error && data, 'Courier profile creation failed');
  return data;
};

const createAuthenticatedClient = async (service, email, password) => {
  const sessionResult = await service.auth.signInWithPassword({ email, password });
  assert(
    !sessionResult.error && sessionResult.data.session?.access_token,
    `Auth session creation failed: ${sessionResult.error?.status ?? 'unknown'} ${
      sessionResult.error?.code ?? 'unknown'
    }`,
  );

  return {
    accessToken: sessionResult.data.session.access_token,
  };
};

const startApi = async () => {
  const appPath = path.join(backendRoot, 'dist', 'src', 'app.js');
  assert(existsSync(appPath), 'Backend build missing. Run npm run build before smoke.');

  const { app } = await import(pathToFileURL(appPath).href);
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert(address && typeof address === 'object', 'API server did not expose an address');

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
};

const apiRequest = async (baseUrl, pathName, token, init = {}) => {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
};

const expectApiStatus = async (baseUrl, pathName, token, expectedStatus, init = {}) => {
  const { response, body } = await apiRequest(baseUrl, pathName, token, init);
  assert(
    response.status === expectedStatus,
    `Expected ${pathName} to return ${expectedStatus}, received ${response.status}`,
  );
  return body;
};

const assertDeniedSelect = async (client, tableName) => {
  const { error } = await client.from(tableName).select('*').limit(1);
  assert(error, `${tableName} select should be denied`);
};

const restRequest = async ({
  tableName,
  accessToken = null,
  method = 'GET',
  query = '',
  payload = null,
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tableName}${query}`,
    {
      method,
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(payload ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    },
  );

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
};

const restSelect = async (accessToken, tableName, select) => {
  const query = `?select=${encodeURIComponent(select)}`;
  const { response, body } = await restRequest({ tableName, accessToken, query });
  assert(response.ok, `${tableName} authenticated select failed with status ${response.status}`);
  return body;
};

const assertDeniedRestSelect = async (tableName, accessToken = null) => {
  const { response } = await restRequest({ tableName, accessToken, query: '?select=*&limit=1' });
  assert(!response.ok, `${tableName} select should be denied`);
};

const assertDeniedRestInsert = async (tableName, payload, accessToken) => {
  const { response } = await restRequest({ tableName, accessToken, method: 'POST', payload });
  assert(!response.ok, `${tableName} insert should be denied`);
};

const cleanup = async (service, created) => {
  const residue = [];

  const cleanupStep = async (name, fn) => {
    try {
      await fn();
    } catch {
      residue.push(name);
    }
  };

  if (created.domainUserIds.length > 0) {
    await cleanupStep('delivery_requests', async () => {
      if (created.storeIds.length > 0) {
        await service.from('delivery_requests').delete().in('store_id', created.storeIds);
      }

      if (created.courierIds.length > 0) {
        await service.from('delivery_requests').delete().in('courier_id', created.courierIds);
      }
    });
    await cleanupStep('push_subscriptions', async () => {
      await service.from('push_subscriptions').delete().in('user_id', created.domainUserIds);
    });
    await cleanupStep('payments', async () => {
      await service.from('payments').delete().in('user_id', created.domainUserIds);
    });
    await cleanupStep('stores', async () => {
      if (created.storeIds.length > 0) {
        await service.from('stores').delete().in('id', created.storeIds);
      }
    });
    await cleanupStep('couriers', async () => {
      if (created.courierIds.length > 0) {
        await service.from('couriers').delete().in('id', created.courierIds);
      }
    });
    await cleanupStep('users', async () => {
      await service.from('users').delete().in('id', created.domainUserIds);
    });
  }

  for (const authUserId of created.authUserIds) {
    await cleanupStep('auth_user', async () => {
      await service.auth.admin.deleteUser(authUserId);
    });
  }

  if (residue.length > 0) {
    throw new Error(`Cleanup incomplete for resource groups: ${[...new Set(residue)].join(', ')}`);
  }
};

const main = async () => {
  assertRequiredEnv();

  const stamp = `${Date.now()}`;
  const password = makePassword(stamp);
  const created = {
    authUserIds: [],
    domainUserIds: [],
    storeIds: [],
    courierIds: [],
  };

  let apiServer = null;
  const { service, anon } = createSupabaseClients();

  try {
    logStep('creating fictitious Auth/domain users');

    const adminAuth = await createAuthUser(service, makeEmail(stamp, 'admin'), password, 'admin');
    created.authUserIds.push(adminAuth.id);
    const adminUser = await createDomainUser(service, adminAuth, adminAuth.email, 'admin', 'ativo');
    created.domainUserIds.push(adminUser.id);

    const storeAuth = await createAuthUser(service, makeEmail(stamp, 'store'), password, 'logista');
    created.authUserIds.push(storeAuth.id);
    const storeUser = await createDomainUser(
      service,
      storeAuth,
      storeAuth.email,
      'logista',
      'ativo',
      adminUser.id,
    );
    created.domainUserIds.push(storeUser.id);
    const storeProfile = await createStore(service, storeUser.id, stamp);
    created.storeIds.push(storeProfile.id);

    const pendingAuth = await createAuthUser(
      service,
      makeEmail(stamp, 'pending'),
      password,
      'logista',
    );
    created.authUserIds.push(pendingAuth.id);
    const pendingUser = await createDomainUser(
      service,
      pendingAuth,
      pendingAuth.email,
      'logista',
      'pendente',
    );
    created.domainUserIds.push(pendingUser.id);
    const pendingStoreProfile = await createStore(service, pendingUser.id, stamp);
    created.storeIds.push(pendingStoreProfile.id);

    const courierAuth = await createAuthUser(
      service,
      makeEmail(stamp, 'courier'),
      password,
      'motoboy',
    );
    created.authUserIds.push(courierAuth.id);
    const courierUser = await createDomainUser(
      service,
      courierAuth,
      courierAuth.email,
      'motoboy',
      'ativo',
      adminUser.id,
    );
    created.domainUserIds.push(courierUser.id);
    const courierProfile = await createCourier(service, courierUser.id, stamp, false);
    created.courierIds.push(courierProfile.id);

    logStep('creating real Supabase Auth sessions');
    const adminSession = await createAuthenticatedClient(service, adminAuth.email, password);
    const storeSession = await createAuthenticatedClient(service, storeAuth.email, password);
    const pendingSession = await createAuthenticatedClient(service, pendingAuth.email, password);
    const courierSession = await createAuthenticatedClient(service, courierAuth.email, password);

    logStep('starting local API from built backend');
    apiServer = await startApi();

    const meBody = await expectApiStatus(
      apiServer.baseUrl,
      '/api/auth/me',
      storeSession.accessToken,
      200,
    );
    assert(meBody?.success === true, '/api/auth/me did not return success');
    assert(meBody.data?.user?.id === storeUser.id, '/api/auth/me returned wrong domain user');

    await expectApiStatus(
      apiServer.baseUrl,
      '/api/admin/users?page=1&limit=5',
      pendingSession.accessToken,
      403,
    );
    await expectApiStatus(
      apiServer.baseUrl,
      '/api/admin/users?page=1&limit=5',
      storeSession.accessToken,
      403,
    );
    await expectApiStatus(
      apiServer.baseUrl,
      '/api/admin/users?page=1&limit=5',
      courierSession.accessToken,
      403,
    );

    const usersBody = await expectApiStatus(
      apiServer.baseUrl,
      '/api/admin/users?page=1&limit=5',
      adminSession.accessToken,
      200,
    );
    assert(usersBody?.success === true, 'Admin user list did not return success');
    assert(usersBody.data?.pagination?.limit === 5, 'Admin user list pagination not respected');

    await expectApiStatus(
      apiServer.baseUrl,
      `/api/admin/users/${pendingUser.id}/approve`,
      storeSession.accessToken,
      403,
      { method: 'PATCH' },
    );
    await expectApiStatus(
      apiServer.baseUrl,
      `/api/admin/users/${pendingUser.id}/block`,
      storeSession.accessToken,
      403,
      { method: 'PATCH' },
    );
    await expectApiStatus(
      apiServer.baseUrl,
      `/api/admin/users/${pendingUser.id}/unblock`,
      storeSession.accessToken,
      403,
      { method: 'PATCH' },
    );
    await expectApiStatus(
      apiServer.baseUrl,
      `/api/admin/users/${pendingUser.id}/approve`,
      adminSession.accessToken,
      200,
      { method: 'PATCH' },
    );
    await expectApiStatus(
      apiServer.baseUrl,
      `/api/admin/users/${pendingUser.id}/block`,
      adminSession.accessToken,
      200,
      { method: 'PATCH' },
    );
    await expectApiStatus(
      apiServer.baseUrl,
      `/api/admin/users/${pendingUser.id}/unblock`,
      adminSession.accessToken,
      200,
      { method: 'PATCH' },
    );

    logStep('validating RLS with anon and authenticated clients');
    for (const tableName of [
      'users',
      'stores',
      'couriers',
      'payments',
      'delivery_requests',
      'push_subscriptions',
    ]) {
      await assertDeniedSelect(anon, tableName);
    }

    const visibleUsers = await restSelect(storeSession.accessToken, 'users', domainUserSelect);
    assert(
      visibleUsers.length === 1 && visibleUsers[0].id === storeUser.id,
      'Authenticated user saw non-own users',
    );

    await assertDeniedRestSelect('payments', storeSession.accessToken);

    await assertDeniedRestInsert(
      'users',
      {
        auth_id: storeAuth.id,
        email: makeEmail(stamp, 'forbidden-users-insert'),
        role: 'logista',
        status: 'pendente',
      },
      storeSession.accessToken,
    );
    await assertDeniedRestInsert(
      'stores',
      {
        user_id: storeUser.id,
        name: 'Loja Proibida',
        owner_name: 'Operador Ficticio',
        address: 'Endereco Ficticio',
      },
      storeSession.accessToken,
    );
    await assertDeniedRestInsert(
      'couriers',
      {
        user_id: courierUser.id,
        full_name: 'Motoboy Proibido',
      },
      courierSession.accessToken,
    );

    const visibleStores = await restSelect(storeSession.accessToken, 'stores', storeSelect);
    assert(
      visibleStores.length === 1 && visibleStores[0].id === storeProfile.id,
      'Store user saw non-own stores',
    );

    const visibleCouriers = await restSelect(courierSession.accessToken, 'couriers', courierSelect);
    assert(
      visibleCouriers.length === 1 && visibleCouriers[0].id === courierProfile.id,
      'Courier user saw non-own couriers',
    );

    logStep('all checks passed');
  } finally {
    if (apiServer) {
      await apiServer.close();
    }

    logStep('cleaning temporary resources');
    await cleanup(service, created);
    logStep('cleanup completed');
  }
};

main().catch((error) => {
  console.error(`[smoke-auth-rls] failed: ${error.message}`);
  process.exitCode = 1;
});
