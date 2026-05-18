import type { SupabaseClient } from '@supabase/supabase-js';

import { getBackendEnv } from '../config/env.js';
import { getSupabaseAdminClient } from '../config/supabase.js';
import type { DeliveryStatus } from '../types/domain.js';

export const DELIVERY_CREATED_EVENT = 'delivery.created';
export const DELIVERY_ACCEPTED_EVENT = 'delivery.accepted';
export const DELIVERY_STATUS_CHANGED_EVENT = 'delivery.status_changed';
export const DELIVERY_AVAILABLE_TOPIC = 'delivery:available';
export const REALTIME_BROADCAST_TIMEOUT_MS = 1000;

type RealtimeDeliveryStatus = Extract<
  DeliveryStatus,
  'aguardando' | 'aceita' | 'coletada' | 'em_transito' | 'entregue'
>;

interface DeliveryBroadcastSource {
  id: string;
  status: DeliveryStatus;
  updated_at: string;
}

export interface DeliveryRealtimePayload {
  deliveryId: string;
  status: RealtimeDeliveryStatus;
  updatedAt: string;
}

const realtimeDeliveryStatuses: ReadonlySet<DeliveryStatus> = new Set([
  'aguardando',
  'aceita',
  'coletada',
  'em_transito',
  'entregue',
]);

const toDeliveryRealtimePayload = (
  delivery: DeliveryBroadcastSource,
): DeliveryRealtimePayload | null => {
  if (!realtimeDeliveryStatuses.has(delivery.status)) {
    return null;
  }

  return {
    deliveryId: delivery.id,
    status: delivery.status as RealtimeDeliveryStatus,
    updatedAt: delivery.updated_at,
  };
};

const logBroadcastResult = (
  event: string,
  deliveryId: string,
  result: 'success' | 'failed' | 'skipped',
) => {
  console.log(
    JSON.stringify({
      event,
      delivery_id: deliveryId,
      result,
    }),
  );
};

const sendDeliveryBroadcast = async (
  topic: string,
  event: string,
  delivery: DeliveryBroadcastSource,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<void> => {
  const payload = toDeliveryRealtimePayload(delivery);

  if (!payload) {
    logBroadcastResult(event, delivery.id, 'skipped');
    return;
  }

  try {
    await supabase.realtime.setAuth(getBackendEnv().SUPABASE_SERVICE_ROLE_KEY);
    await supabase.channel(topic, { config: { private: true } }).httpSend(event, payload, {
      timeout: REALTIME_BROADCAST_TIMEOUT_MS,
    });
    logBroadcastResult(event, delivery.id, 'success');
  } catch {
    logBroadcastResult(event, delivery.id, 'failed');
  }
};

export const broadcastDeliveryCreated = (
  delivery: DeliveryBroadcastSource,
  supabase?: SupabaseClient,
): Promise<void> =>
  sendDeliveryBroadcast(DELIVERY_AVAILABLE_TOPIC, DELIVERY_CREATED_EVENT, delivery, supabase);

export const broadcastDeliveryAccepted = (
  delivery: DeliveryBroadcastSource,
  supabase?: SupabaseClient,
): Promise<void> =>
  sendDeliveryBroadcast(`delivery:${delivery.id}`, DELIVERY_ACCEPTED_EVENT, delivery, supabase);

export const broadcastDeliveryStatusChanged = (
  delivery: DeliveryBroadcastSource,
  supabase?: SupabaseClient,
): Promise<void> =>
  sendDeliveryBroadcast(
    `delivery:${delivery.id}`,
    DELIVERY_STATUS_CHANGED_EVENT,
    delivery,
    supabase,
  );
