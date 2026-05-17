import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type { DeliveryRequest } from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type {
  CreateDeliveryInput,
  ListAvailableDeliveriesQuery,
  ListCourierHistoryQuery,
  ListDeliveriesQuery,
  UpdateDeliveryStatusInput,
} from '../validators/delivery.validators.js';

const storeOwnershipSelect = 'id,user_id';
const courierOwnershipSelect = 'id,user_id,is_online';
const deliveryRequestSelect =
  'id,store_id,destination_address,notes,status,courier_id,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at';
const storeDeliveryListSelect =
  'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at';
const courierAvailableDeliverySelect = 'id,status,created_at,expires_at,stores(name,address)';
const courierAcceptedDeliverySelect =
  'id,status,courier_id,accepted_at,created_at,expires_at,stores(name,address)';
const courierActiveDeliverySelect =
  'id,destination_address,notes,status,accepted_at,created_at,expires_at,stores(name,address)';
const courierHistoryDeliverySelect =
  'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at,stores(name,address)';
const databaseNow = 'now';

type CourierActiveStatus = Extract<
  DeliveryRequest['status'],
  'aceita' | 'coletada' | 'em_transito'
>;
type CourierTransitionStatus = UpdateDeliveryStatusInput['status'];
type CourierVisibleStatus = CourierActiveStatus | CourierTransitionStatus;

const courierActiveStatuses: CourierActiveStatus[] = ['aceita', 'coletada', 'em_transito'];
const deliveryTransitions: Record<
  CourierTransitionStatus,
  {
    from: CourierVisibleStatus;
    timestampColumn: 'collected_at' | 'in_transit_at' | 'delivered_at';
  }
> = {
  coletada: {
    from: 'aceita',
    timestampColumn: 'collected_at',
  },
  em_transito: {
    from: 'coletada',
    timestampColumn: 'in_transit_at',
  },
  entregue: {
    from: 'em_transito',
    timestampColumn: 'delivered_at',
  },
};

interface StoreOwnership {
  id: string;
  user_id: string;
}

interface CourierOwnership {
  id: string;
  user_id: string;
  is_online: boolean;
}

interface DeliveryStoreSummary {
  name: string;
  address: string;
}

interface CourierDeliveryRow {
  id: string;
  status: DeliveryRequest['status'];
  created_at: string;
  expires_at: string;
  stores?: DeliveryStoreSummary | DeliveryStoreSummary[] | null;
}

interface CourierAcceptedDeliveryRow extends CourierDeliveryRow {
  courier_id: string | null;
  accepted_at: string | null;
}

interface CourierActiveDeliveryRow extends CourierDeliveryRow {
  destination_address: string | null;
  notes: string | null;
  accepted_at: string | null;
}

interface CourierHistoryDeliveryRow extends CourierActiveDeliveryRow {
  collected_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  updated_at: string;
}

export interface StoreDeliveryListItem {
  id: string;
  destination_address: string | null;
  notes: string | null;
  status: DeliveryRequest['status'];
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  collected_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  updated_at: string;
}

export interface StoreDeliveryList {
  items: StoreDeliveryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CourierAvailableDeliveryListItem {
  id: string;
  status: DeliveryRequest['status'];
  created_at: string;
  expires_at: string;
  store: DeliveryStoreSummary;
}

export interface CourierAvailableDeliveryList {
  items: CourierAvailableDeliveryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CourierAcceptedDeliveryState {
  id: string;
  status: DeliveryRequest['status'];
  courier_id: string | null;
  accepted_at: string | null;
  created_at: string;
  expires_at: string;
  store: DeliveryStoreSummary;
}

export interface CourierActiveDeliveryState {
  id: string;
  destination_address: string | null;
  notes: string | null;
  status: CourierActiveStatus;
  accepted_at: string | null;
  created_at: string;
  expires_at: string;
  store: DeliveryStoreSummary;
}

export interface CourierDeliveryHistoryItem {
  id: string;
  destination_address: string | null;
  notes: string | null;
  status: DeliveryRequest['status'];
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  collected_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  updated_at: string;
  store: DeliveryStoreSummary;
}

export interface CourierDeliveryHistory {
  items: CourierDeliveryHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CourierDeliveryStatusState {
  id: string;
  destination_address: string | null;
  notes: string | null;
  status: CourierVisibleStatus;
  accepted_at: string | null;
  created_at: string;
  expires_at: string;
  store: DeliveryStoreSummary;
}

const resolveOwnedStore = async (
  domainUserId: string,
  supabase: SupabaseClient,
): Promise<StoreOwnership> => {
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select(storeOwnershipSelect)
    .eq('user_id', domainUserId)
    .single<StoreOwnership>();

  if (storeError || !store) {
    throw new ApiError(403, 'STORE_PROFILE_REQUIRED', 'Perfil de loja nao encontrado');
  }

  return store;
};

const resolveCourier = async (
  domainUserId: string,
  supabase: SupabaseClient,
): Promise<CourierOwnership> => {
  const { data: courier, error: courierError } = await supabase
    .from('couriers')
    .select(courierOwnershipSelect)
    .eq('user_id', domainUserId)
    .single<CourierOwnership>();

  if (courierError || !courier) {
    throw new ApiError(403, 'COURIER_PROFILE_REQUIRED', 'Perfil de motoboy nao encontrado');
  }

  return courier;
};

const resolveOnlineCourier = async (
  domainUserId: string,
  supabase: SupabaseClient,
): Promise<CourierOwnership> => {
  const courier = await resolveCourier(domainUserId, supabase);

  if (!courier.is_online) {
    throw new ApiError(403, 'COURIER_OFFLINE', 'Motoboy offline');
  }

  return courier;
};

const normalizeOptionalText = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeStoreSummary = (relation: CourierDeliveryRow['stores']): DeliveryStoreSummary => {
  const store = Array.isArray(relation) ? relation[0] : relation;

  return {
    name: typeof store?.name === 'string' ? store.name : '',
    address: typeof store?.address === 'string' ? store.address : '',
  };
};

const toCourierAvailableDeliveryListItem = (
  row: CourierDeliveryRow,
): CourierAvailableDeliveryListItem => ({
  id: row.id,
  status: row.status,
  created_at: row.created_at,
  expires_at: row.expires_at,
  store: normalizeStoreSummary(row.stores),
});

const toCourierAcceptedDeliveryState = (
  row: CourierAcceptedDeliveryRow,
): CourierAcceptedDeliveryState => ({
  id: row.id,
  status: row.status,
  courier_id: row.courier_id,
  accepted_at: row.accepted_at,
  created_at: row.created_at,
  expires_at: row.expires_at,
  store: normalizeStoreSummary(row.stores),
});

const toCourierDeliveryStatusState = (
  row: CourierActiveDeliveryRow,
): CourierDeliveryStatusState => ({
  id: row.id,
  destination_address: row.destination_address,
  notes: row.notes,
  status: row.status as CourierVisibleStatus,
  accepted_at: row.accepted_at,
  created_at: row.created_at,
  expires_at: row.expires_at,
  store: normalizeStoreSummary(row.stores),
});

const toCourierActiveDeliveryState = (
  row: CourierActiveDeliveryRow,
): CourierActiveDeliveryState => ({
  ...toCourierDeliveryStatusState(row),
  status: row.status as CourierActiveStatus,
});

const toCourierDeliveryHistoryItem = (
  row: CourierHistoryDeliveryRow,
): CourierDeliveryHistoryItem => ({
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
  store: normalizeStoreSummary(row.stores),
});

export const createDelivery = async (
  input: CreateDeliveryInput,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<DeliveryRequest> => {
  const store = await resolveOwnedStore(domainUserId, supabase);

  const destinationAddress = normalizeOptionalText(input.destinationAddress);
  const notes = normalizeOptionalText(input.notes);
  const { data, error } = await supabase
    .from('delivery_requests')
    .insert({
      store_id: store.id,
      destination_address: destinationAddress,
      notes,
    })
    .select(deliveryRequestSelect)
    .single<DeliveryRequest>();

  if (error || !data) {
    throw new ApiError(500, 'DELIVERY_CREATE_FAILED', 'Solicitacao de entrega nao pode ser criada');
  }

  return data;
};

export const listStoreDeliveries = async (
  input: ListDeliveriesQuery,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<StoreDeliveryList> => {
  const store = await resolveOwnedStore(domainUserId, supabase);

  const offset = (input.page - 1) * input.limit;
  let query = supabase
    .from('delivery_requests')
    .select(storeDeliveryListSelect, { count: 'exact' })
    .eq('store_id', store.id);

  if (input.status) {
    query = query.eq('status', input.status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + input.limit - 1);

  if (error) {
    throw new ApiError(500, 'DELIVERY_LIST_FAILED', 'Listagem de entregas falhou');
  }

  return {
    items: (data ?? []) as StoreDeliveryListItem[],
    pagination: {
      page: input.page,
      limit: input.limit,
      total: count ?? 0,
    },
  };
};

export const listAvailableDeliveriesForCourier = async (
  input: ListAvailableDeliveriesQuery,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierAvailableDeliveryList> => {
  await resolveOnlineCourier(domainUserId, supabase);

  const offset = (input.page - 1) * input.limit;
  const { data, error, count } = await supabase
    .from('delivery_requests')
    .select(courierAvailableDeliverySelect, { count: 'exact' })
    .eq('status', 'aguardando')
    .is('courier_id', null)
    .gt('expires_at', databaseNow)
    .order('created_at', { ascending: false })
    .range(offset, offset + input.limit - 1);

  if (error) {
    throw new ApiError(500, 'DELIVERY_AVAILABLE_LIST_FAILED', 'Listagem de entregas falhou');
  }

  return {
    items: ((data ?? []) as CourierDeliveryRow[]).map(toCourierAvailableDeliveryListItem),
    pagination: {
      page: input.page,
      limit: input.limit,
      total: count ?? 0,
    },
  };
};

export const acceptDeliveryForCourier = async (
  deliveryId: string,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierAcceptedDeliveryState> => {
  const courier = await resolveOnlineCourier(domainUserId, supabase);

  const { data: accepted, error: acceptError } = await supabase
    .from('delivery_requests')
    .update({
      status: 'aceita',
      courier_id: courier.id,
      accepted_at: databaseNow,
    })
    .eq('id', deliveryId)
    .eq('status', 'aguardando')
    .is('courier_id', null)
    .gt('expires_at', databaseNow)
    .select(courierAcceptedDeliverySelect)
    .maybeSingle<CourierAcceptedDeliveryRow>();

  if (acceptError) {
    console.log(
      JSON.stringify({
        event: 'delivery_accept',
        delivery_id: deliveryId,
        courier_id: courier.id,
        result: 'failed',
      }),
    );
    throw new ApiError(500, 'DELIVERY_ACCEPT_FAILED', 'Aceite de entrega falhou');
  }

  if (accepted) {
    console.log(
      JSON.stringify({
        event: 'delivery_accept',
        delivery_id: deliveryId,
        courier_id: courier.id,
        result: 'accepted',
      }),
    );
    return toCourierAcceptedDeliveryState(accepted);
  }

  const { data: current, error: currentError } = await supabase
    .from('delivery_requests')
    .select(courierAcceptedDeliverySelect)
    .eq('id', deliveryId)
    .maybeSingle<CourierAcceptedDeliveryRow>();

  if (currentError) {
    console.log(
      JSON.stringify({
        event: 'delivery_accept',
        delivery_id: deliveryId,
        courier_id: courier.id,
        result: 'failed',
      }),
    );
    throw new ApiError(500, 'DELIVERY_ACCEPT_FAILED', 'Aceite de entrega falhou');
  }

  if (!current) {
    console.log(
      JSON.stringify({
        event: 'delivery_accept',
        delivery_id: deliveryId,
        courier_id: courier.id,
        result: 'not_found',
      }),
    );
    throw new ApiError(404, 'DELIVERY_NOT_FOUND', 'Entrega nao encontrada');
  }

  if (current.courier_id === courier.id) {
    console.log(
      JSON.stringify({
        event: 'delivery_accept',
        delivery_id: deliveryId,
        courier_id: courier.id,
        result: 'idempotent',
      }),
    );
    return toCourierAcceptedDeliveryState(current);
  }

  const deliveryExpired = Date.parse(current.expires_at) <= Date.now();
  const stillWaitingWithoutCourier = current.status === 'aguardando' && current.courier_id === null;

  if (deliveryExpired && stillWaitingWithoutCourier) {
    console.log(
      JSON.stringify({
        event: 'delivery_accept',
        delivery_id: deliveryId,
        courier_id: courier.id,
        result: 'expired',
      }),
    );
    throw new ApiError(409, 'DELIVERY_EXPIRED', 'Entrega expirada');
  }

  console.log(
    JSON.stringify({
      event: 'delivery_accept',
      delivery_id: deliveryId,
      courier_id: courier.id,
      result: 'already_accepted',
    }),
  );
  throw new ApiError(409, 'ALREADY_ACCEPTED', 'Entrega ja aceita');
};

export const getActiveDeliveryForCourier = async (
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierActiveDeliveryState | null> => {
  const courier = await resolveOnlineCourier(domainUserId, supabase);

  const { data, error } = await supabase
    .from('delivery_requests')
    .select(courierActiveDeliverySelect)
    .eq('courier_id', courier.id)
    .in('status', courierActiveStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<CourierActiveDeliveryRow>();

  if (error) {
    throw new ApiError(500, 'DELIVERY_ACTIVE_GET_FAILED', 'Busca da corrida ativa falhou');
  }

  return data ? toCourierActiveDeliveryState(data) : null;
};

export const listCourierDeliveryHistory = async (
  input: ListCourierHistoryQuery,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierDeliveryHistory> => {
  const courier = await resolveCourier(domainUserId, supabase);

  const offset = (input.page - 1) * input.limit;
  let query = supabase
    .from('delivery_requests')
    .select(courierHistoryDeliverySelect, { count: 'exact' })
    .eq('courier_id', courier.id);

  if (input.status) {
    query = query.eq('status', input.status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + input.limit - 1);

  if (error) {
    throw new ApiError(500, 'DELIVERY_HISTORY_LIST_FAILED', 'Historico de entregas falhou');
  }

  return {
    items: ((data ?? []) as CourierHistoryDeliveryRow[]).map(toCourierDeliveryHistoryItem),
    pagination: {
      page: input.page,
      limit: input.limit,
      total: count ?? 0,
    },
  };
};

export const updateDeliveryStatusForCourier = async (
  deliveryId: string,
  status: CourierTransitionStatus,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierDeliveryStatusState> => {
  const courier = await resolveOnlineCourier(domainUserId, supabase);
  const transition = deliveryTransitions[status];
  const updatePayload = {
    status,
    [transition.timestampColumn]: databaseNow,
  };

  const { data: updated, error: updateError } = await supabase
    .from('delivery_requests')
    .update(updatePayload)
    .eq('id', deliveryId)
    .eq('courier_id', courier.id)
    .eq('status', transition.from)
    .select(courierActiveDeliverySelect)
    .maybeSingle<CourierActiveDeliveryRow>();

  if (updateError) {
    console.log(
      JSON.stringify({
        event: 'delivery_status_update',
        delivery_id: deliveryId,
        courier_id: courier.id,
        from_status: transition.from,
        to_status: status,
        result: 'failed',
      }),
    );
    throw new ApiError(500, 'DELIVERY_STATUS_UPDATE_FAILED', 'Atualizacao de status falhou');
  }

  if (updated) {
    console.log(
      JSON.stringify({
        event: 'delivery_status_update',
        delivery_id: deliveryId,
        courier_id: courier.id,
        from_status: transition.from,
        to_status: status,
        result: 'updated',
      }),
    );
    return toCourierDeliveryStatusState(updated);
  }

  const { data: current, error: currentError } = await supabase
    .from('delivery_requests')
    .select(courierActiveDeliverySelect)
    .eq('id', deliveryId)
    .eq('courier_id', courier.id)
    .maybeSingle<CourierActiveDeliveryRow>();

  if (currentError) {
    console.log(
      JSON.stringify({
        event: 'delivery_status_update',
        delivery_id: deliveryId,
        courier_id: courier.id,
        from_status: transition.from,
        to_status: status,
        result: 'failed',
      }),
    );
    throw new ApiError(500, 'DELIVERY_STATUS_UPDATE_FAILED', 'Atualizacao de status falhou');
  }

  if (!current) {
    console.log(
      JSON.stringify({
        event: 'delivery_status_update',
        delivery_id: deliveryId,
        courier_id: courier.id,
        from_status: null,
        to_status: status,
        result: 'not_found',
      }),
    );
    throw new ApiError(404, 'DELIVERY_NOT_FOUND', 'Entrega nao encontrada');
  }

  if (current.status === status) {
    console.log(
      JSON.stringify({
        event: 'delivery_status_update',
        delivery_id: deliveryId,
        courier_id: courier.id,
        from_status: current.status,
        to_status: status,
        result: 'idempotent',
      }),
    );
    return toCourierDeliveryStatusState(current);
  }

  console.log(
    JSON.stringify({
      event: 'delivery_status_update',
      delivery_id: deliveryId,
      courier_id: courier.id,
      from_status: current.status,
      to_status: status,
      result: 'invalid_transition',
    }),
  );
  throw new ApiError(409, 'INVALID_DELIVERY_TRANSITION', 'Transicao de entrega invalida');
};
