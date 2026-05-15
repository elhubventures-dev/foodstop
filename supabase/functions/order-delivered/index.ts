import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const internalSecret = Deno.env.get("INTERNAL_EDGE_SECRET");
  const provided = req.headers.get("x-internal-key");

  if (!internalSecret || provided !== internalSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const orderId = body.orderId;
  if (!orderId || typeof orderId !== "string") {
    return new Response(JSON.stringify({ error: "orderId is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, merchant_id, status, subtotal, total, paystack_reference",
    )
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return new Response(
      JSON.stringify({ error: "Order not found", detail: orderErr?.message }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (order.status !== "delivered") {
    return new Response(
      JSON.stringify({
        error: "Commission only runs when status is delivered",
        status: order.status,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!order.merchant_id) {
    return new Response(
      JSON.stringify({ error: "Order has no merchant_id" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { data: merchant, error: mErr } = await supabase
    .from("merchants")
    .select("commission_rate")
    .eq("id", order.merchant_id)
    .single();

  if (mErr || !merchant) {
    return new Response(
      JSON.stringify({ error: "Merchant not found", detail: mErr?.message }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const commissionRate =
    merchant.commission_rate != null
      ? Number(merchant.commission_rate)
      : 0.15;
  const vatRate = Number(Deno.env.get("VAT_RATE") ?? "0.075");

  const { data: rpcResult, error: rpcErr } = await supabase.rpc(
    "credit_merchant_for_delivered_order",
    {
      p_order_id: order.id,
      p_merchant_id: order.merchant_id,
      p_food_subtotal: Number(order.subtotal),
      p_grand_total: Number(order.total),
      p_commission_rate: commissionRate,
      p_vat_rate: vatRate,
      p_order_reference: order.paystack_reference ?? order.id,
    },
  );

  if (rpcErr) {
    return new Response(
      JSON.stringify({ error: rpcErr.message, code: rpcErr.code }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      result: rpcResult,
      note:
        "RPC credited pending wallet. Schedule the 2h release separately (e.g. packages/api BullMQ or pg_cron calling release_merchant_pending_for_order).",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
