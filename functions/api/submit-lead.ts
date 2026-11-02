// Cloudflare Pages Function: forwards lead submissions to the CRM.
// CRM docs: POST https://stadochtradgard.se/dashboard/submit_form (JSON or Form URL Encoded)
//   Required: service_type, name, and phone or email.
//   CRM allowed service_types: Hemstäd, Fönsterputsning, window_cleaning, Flyttstädning, Företagskunder.
//   For garden cleaning / trädgårdsservice, CRM schema categorizes as "Hemstäd"
//   with form: "Trädgårdsservice" and garden details saved on the lead.

const CRM_URL = "https://stadochtradgard.se/dashboard/submit_form";
const DEFAULT_FORM = "Trädgårdsservice";

// Allowed service_type values strictly accepted by the CRM backend
const CRM_ACCEPTED_SERVICES = [
  "Hemstäd",
  "Fönsterputsning",
  "window_cleaning",
  "Flyttstädning",
  "Företagskunder"
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
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
    try {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } catch {
      return json({ success: false, error: "Invalid request body" }, 400);
    }
  }

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  if (!name || (!phone && !email)) {
    return json({ success: false, error: "name and phone or email are required" }, 400);
  }

  const incomingUa = request.headers.get("user-agent") || "";
  const userAgent = incomingUa && !incomingUa.toLowerCase().includes("curl")
    ? incomingUa
    : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  const clientIp = body.user_ip || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "";

  const requestedService = String(body.service_type || body.service || "").trim();

  // If service_type is not directly in the CRM's strict enum (e.g. "Garden cleaning", "Trädgårdsservice"),
  // map it to "Hemstäd" so the CRM database accepts it without error.
  const crmServiceType = CRM_ACCEPTED_SERVICES.includes(requestedService)
    ? requestedService
    : "Hemstäd";

  const payload: Record<string, any> = {
    ...body,
    name,
    phone,
    email,
    service_type: crmServiceType,
    // Preserve full details for CRM lead viewer
    form: body.form || DEFAULT_FORM,
    requested_service_type: requestedService || "Garden cleaning",
    garden_service: body.garden_service || requestedService || "Garden cleaning",
    actual_service: requestedService || "Garden cleaning",
    user_agent: body.user_agent || incomingUa || userAgent,
    user_ip: clientIp,
  };

  try {
    let response = await fetch(CRM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "Accept": "application/json, text/plain, */*"
      },
      body: JSON.stringify(payload),
    });

    let text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // plain text response
    }

    // If CRM rejected due to service_type validation, retry once with Hemstäd
    if (data?.errors?.service_type && payload.service_type !== "Hemstäd") {
      payload.service_type = "Hemstäd";
      response = await fetch(CRM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "Accept": "application/json, text/plain, */*"
        },
        body: JSON.stringify(payload),
      });
      text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        // plain text
      }
    }

    const isSuccess = response.ok || data?.result === "success" || Boolean(data?.id);
    const leadId = data?.id ?? data?.customer_id ?? null;

    return json({
      success: isSuccess,
      status: response.status,
      id: leadId,
      data,
      textExcerpt: data ? undefined : text.substring(0, 300),
    }, 200);
  } catch (err: any) {
    console.error("CRM proxy fetch error:", err);
    return json({ success: false, error: err?.message || "CRM request failed" }, 200);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
