"use client";

import { supabase } from "./supabase";
import type { CartItem } from "./cart";

/* ───────────────────────────── Types ───────────────────────────── */

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
};

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "cloth_received"
  | "cutting"
  | "in_production"
  | "fitting_ready"
  | "finishing"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed:           "Order placed",
  confirmed:        "Confirmed by atelier",
  cloth_received:   "Cloth received",
  cutting:          "On the cutting bench",
  in_production:    "In production",
  fitting_ready:    "Ready for fitting",
  finishing:        "Finishing",
  ready_for_pickup: "Ready for pickup",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "placed", "confirmed", "cloth_received", "cutting", "in_production",
  "fitting_ready", "finishing", "ready_for_pickup", "delivered", "cancelled",
];

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    line1?: string;
    line2?: string;
    city?: string;
    country?: string;
  };
  subtotal: number;
  currency: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  item_type: "product" | "commission";
  sku: string;
  name: string;
  type_label: string;
  price_num: number;
  qty: number;
  image: string;
  custom: Record<string, unknown>;
};

export type StatusHistoryEntry = {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string;
  changed_at: string;
};

/* ───────────────────────────── Profile ───────────────────────────── */

/** Profile is "complete" once we have the minimum fields the atelier needs. */
export function isProfileComplete(p: Profile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.full_name?.trim() &&
    p.phone?.trim() &&
    p.address_line1?.trim() &&
    p.city?.trim()
  );
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("mtm_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function upsertProfile(p: Profile): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_profiles").upsert(p, { onConflict: "id" });
  return { error: error?.message ?? null };
}

/* ───────────────────────────── Orders ───────────────────────────── */

/** Convert the local cart into an order in Supabase. Returns the new order. */
export async function createOrderFromCart(
  items: CartItem[],
  profile: Profile,
  email: string,
): Promise<{ order: Order | null; error: string | null }> {
  if (items.length === 0) return { order: null, error: "Cart is empty." };

  const subtotal = items.reduce((s, i) => s + i.priceNum * i.qty, 0);

  // Insert the order
  const { data: order, error: orderErr } = await supabase
    .from("mtm_orders")
    .insert({
      user_id:          profile.id,
      customer_name:    profile.full_name,
      customer_email:   email,
      customer_phone:   profile.phone,
      shipping_address: {
        line1:   profile.address_line1,
        line2:   profile.address_line2,
        city:    profile.city,
        country: profile.country,
      },
      subtotal,
      currency: "BHD",
    })
    .select("*")
    .single();

  if (orderErr || !order) {
    return { order: null, error: orderErr?.message ?? "Could not create order." };
  }

  // Insert line items
  const lineRows = items.map((i) => ({
    order_id:   order.id,
    item_type:  i.custom ? "commission" : "product",
    sku:        i.sku,
    name:       i.name,
    type_label: i.type,
    price_num:  i.priceNum,
    qty:        i.qty,
    image:      i.image,
    custom:     i.custom ?? {},
  }));

  const { error: itemsErr } = await supabase.from("mtm_order_items").insert(lineRows);
  if (itemsErr) return { order: order as Order, error: itemsErr.message };

  return { order: order as Order, error: null };
}

export async function listMyOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("mtm_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Order[];
}

export async function fetchOrderByNumber(orderNumber: string): Promise<{
  order: Order | null; items: OrderItem[]; history: StatusHistoryEntry[];
}> {
  const { data: order } = await supabase
    .from("mtm_orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) return { order: null, items: [], history: [] };

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from("mtm_order_items").select("*").eq("order_id", order.id),
    supabase.from("mtm_order_status_history").select("*").eq("order_id", order.id).order("changed_at", { ascending: false }),
  ]);

  return {
    order:   order as Order,
    items:   (items ?? []) as OrderItem[],
    history: (history ?? []) as StatusHistoryEntry[],
  };
}

/* ───────────────────────────── Admin ───────────────────────────── */

export async function listAllOrders(): Promise<Order[]> {
  const { data } = await supabase
    .from("mtm_orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mtm_orders")
    .update({ status })
    .eq("id", orderId);
  return { error: error?.message ?? null };
}

/**
 * Post a free-form message from the atelier into the order's status
 * history. The current status is repeated so the timeline stays readable;
 * the customer's NotificationBell surfaces the note as a Sebastian-voiced
 * notification. Only admins can write here (RLS).
 */
export async function postOrderMessage(
  orderId: string,
  status: OrderStatus,
  note: string,
): Promise<{ error: string | null }> {
  const trimmed = note.trim();
  if (!trimmed) return { error: "Message is empty." };
  const { error } = await supabase
    .from("mtm_order_status_history")
    .insert({ order_id: orderId, status, note: trimmed });
  return { error: error?.message ?? null };
}

/** Recent status_history rows that carry a note. Joins to mtm_orders for the
 *  order_number so the bell can surface them without an extra round-trip.
 *  RLS scopes the result: customers only see their own; admins see all. */
export type RecentMessage = {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  note: string;
  status: OrderStatus;
  changed_at: string;
};

export async function fetchRecentMessages(limit = 20): Promise<RecentMessage[]> {
  const { data, error } = await supabase
    .from("mtm_order_status_history")
    .select("id, order_id, status, note, changed_at, mtm_orders(order_number, customer_name)")
    .neq("note", "")
    .order("changed_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  // PostgREST returns the joined relation as a single object or an array
  // depending on the constraint shape. We accept both and unwrap.
  type Row = {
    id: string;
    order_id: string;
    status: OrderStatus;
    note: string;
    changed_at: string;
    mtm_orders:
      | { order_number: string; customer_name: string }
      | { order_number: string; customer_name: string }[]
      | null;
  };
  return (data as unknown as Row[])
    .map((r) => {
      const ord = Array.isArray(r.mtm_orders) ? r.mtm_orders[0] : r.mtm_orders;
      if (!r.note || !ord) return null;
      return {
        id: r.id,
        order_id: r.order_id,
        order_number: ord.order_number,
        customer_name: ord.customer_name,
        note: r.note,
        status: r.status,
        changed_at: r.changed_at,
      };
    })
    .filter((m): m is RecentMessage => m !== null);
}
