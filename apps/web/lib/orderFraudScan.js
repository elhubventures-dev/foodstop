/**
 * Phase 8 — When `anti_fraud_flags` is enabled, inserts lightweight fraud_flags
 * rows for ops review (rules can expand over time).
 */

async function isAntiFraudEnabled(admin) {
  const { data } = await admin
    .from('platform_feature_flags')
    .select('enabled')
    .eq('flag_key', 'anti_fraud_flags')
    .maybeSingle();
  return !!data?.enabled;
}

async function hasOpenFlag(admin, orderId, flagType) {
  const { data } = await admin
    .from('fraud_flags')
    .select('id')
    .eq('order_id', orderId)
    .eq('flag_type', flagType)
    .eq('status', 'open')
    .maybeSingle();
  return !!data?.id;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ orderId: string; userId: string | null; merchantId: string; total: number }} ctx
 */
export async function scanNewOrderForFraud(admin, ctx) {
  try {
    if (!(await isAntiFraudEnabled(admin))) return;

    const { orderId, userId, merchantId, total } = ctx;
    const t = Number(total);
    const candidates = [];

    if (Number.isFinite(t) && t >= 50_000) {
      candidates.push({
        order_id: orderId,
        merchant_id: merchantId,
        customer_id: userId || null,
        flag_type: 'high_value_cod',
        description: `Order total ₦${t.toLocaleString('en-NG')} meets high-value review threshold (≥ ₦50,000).`,
        severity: 'high',
        status: 'open',
      });
    }

    if (userId) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: cErr } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since);
      if (!cErr && count != null && count > 5) {
        candidates.push({
          order_id: orderId,
          merchant_id: merchantId,
          customer_id: userId,
          flag_type: 'velocity_abuse',
          description: `Customer placed ${count} orders within the last hour (threshold > 5).`,
          severity: 'medium',
          status: 'open',
        });
      }
    }

    for (const row of candidates) {
      if (await hasOpenFlag(admin, orderId, row.flag_type)) continue;
      const { error } = await admin.from('fraud_flags').insert(row);
      if (error) console.error('[orderFraudScan] insert failed', error.message);
    }
  } catch (e) {
    console.error('[orderFraudScan]', e);
  }
}
