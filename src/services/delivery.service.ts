import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type { DeliveryRequest } from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type {
  CreateDeliveryInput,
  ListDeliveriesQuery,
} from '../validators/delivery.validators.js';

const storeOwnershipSelect = 'id,user_id';
const deliveryRequestSelect =
  'id,store_id,destination_address,notes,status,courier_id,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at';
const storeDeliveryListSelect =
  'id,destination_address,notes,status,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at';

interface StoreOwnership {
  id: string;
  user_id: string;
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

const normalizeOptionalText = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
};

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
