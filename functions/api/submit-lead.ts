// Cloudflare Pages Function: forwards lead submissions to the CRM.
// CRM docs: POST https://stadochtradgard.se/dashboard/submit_form (JSON)
//   Required: service_type, name, and phone or email.
//   Every other field (nested objects/arrays included) is saved on the lead.
// The call is made server-side, so the CRM's browser CORS rule doesn't block it.

const CRM_URL = "https://stadochtradgard.se/dashboard/submit_form";
const DEFAULT_FORM = "Trädgårdsservice Landing Page";

// The CRM only accepts these service types
const ALLOWED_SERVICE_TYPES = ["Fönsterputsning", "window_cleaning", "Hemstäd", "Flyttstädning", "Företagskunder"];
// Garden leads have no own CRM type, so they are filed under this one
const FALLBACK_SERVICE_TYPE = "Hemstäd";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

export async function onRequestPost(context: any) {
  const { request } = context;

  let body: Record<string, any>;
  try {
    body = (await request.json()) as Record<string, any>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  if (!name || (!phone && !email)) {
    return json({ success: false, error: "name and phone or email are required" }, 400);
  }

  const requestedService = String(body.service_type || "").trim();
  const serviceType = ALLOWED_SERVICE_TYPES.includes(requestedService) ? requestedService : FALLBACK_SERVICE_TYPE;

  const payload = {
    ...body,
    name,
    phone,
    email,
    service_type: serviceType,
    // Keep what the visitor actually asked for when it had to be remapped
    requested_service_type: requestedService || undefined,
    form: body.form || DEFAULT_FORM,
    user_agent: body.user_agent || request.headers.get("user-agent") || "",
    user_ip: body.user_ip || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "",
  };

  try {
    const response = await fetch(CRM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // CRM answered with plain text
    }

    return json(
      {
        success: response.ok,
        status: response.status,
        id: data?.id ?? data?.customer_id ?? null,
        data,
        textExcerpt: data ? undefined : text.substring(0, 300),
      },
      response.ok ? 200 : 502
    );
  } catch (err: any) {
    return json({ success: false, error: err?.message || "CRM request failed" }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
