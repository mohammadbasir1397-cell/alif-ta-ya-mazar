import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceRoleKey);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const response = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
);

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  try {
    const payload = await request.json();
    const action = typeof payload?.action === "string" ? payload.action : "";

    if (action === "heartbeat") {
      const sessionId = payload?.session_id;
      if (typeof sessionId !== "string" || !uuidPattern.test(sessionId)) return response({ error: "Invalid tracking identifier" }, 400);
      const { error } = await supabase.from("store_live_sessions").upsert(
        { session_id: sessionId, last_seen_at: new Date().toISOString() },
        { onConflict: "session_id", ignoreDuplicates: false },
      );
      if (error) return response({ error: "Tracking unavailable" }, 500);
      return response({ ok: true });
    }

    if (action === "pwa_install") {
      const installationId = payload?.installation_id;
      if (typeof installationId !== "string" || !uuidPattern.test(installationId)) return response({ error: "Invalid tracking identifier" }, 400);
      const { error } = await supabase.from("store_pwa_installs").upsert(
        { installation_id: installationId, last_seen_at: new Date().toISOString() },
        { onConflict: "installation_id", ignoreDuplicates: false },
      );
      if (error) return response({ error: "Tracking unavailable" }, 500);
      return response({ ok: true });
    }

    if (action === "stats") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response({ error: "Unauthorized" }, 401);
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return response({ error: "Unauthorized" }, 401);
      }

      const { data: adminRecord } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminRecord) {
        return response({ error: "Unauthorized" }, 401);
      }

      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const [{ count: activeVisitors, error: visitorError }, { count: pwaInstalls, error: installError }] = await Promise.all([
        supabase.from("store_live_sessions").select("session_id", { count: "exact", head: true }).gte("last_seen_at", cutoff),
        supabase.from("store_pwa_installs").select("installation_id", { count: "exact", head: true }),
      ]);
      if (visitorError || installError) return response({ error: "Analytics unavailable" }, 500);

      return response({
        active_visitors: activeVisitors ?? 0,
        pwa_installs: pwaInstalls ?? 0,
        registered_customers: 0,
        orders: 0,
        customer_tracking_available: false,
        order_tracking_available: false,
        generated_at: new Date().toISOString(),
      });
    }

    return response({ error: "Unknown action" }, 400);
  } catch (_error) {
    return response({ error: "Invalid request" }, 400);
  }
});
