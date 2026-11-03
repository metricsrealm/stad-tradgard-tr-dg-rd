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

  const payload: Record<string, any> = {
    ...body,
    service_type: body.service_type || "Garden cleaning",
    form: body.form || DEFAULT_FORM,
    name,
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {})
  };

  try {
    console.log("\n=======================================================");
    console.log(`[Cloudflare /api/submit-lead] 🚀 FORM SUBMITTED at ${new Date().toISOString()}`);
    console.log(`[Cloudflare /api/submit-lead] Name: ${name} | Phone: ${phone} | Email: ${email}`);
    console.log(`[Cloudflare /api/submit-lead] City: ${payload.city || 'N/A'} | Desired Date: ${payload.desired_date || 'N/A'}`);
    console.log(`[Cloudflare /api/submit-lead] Services:`, payload.services);
    console.log(`[Cloudflare /api/submit-lead] Submitting payload to CRM:`, JSON.stringify(payload, null, 2));

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
    console.log(`[Cloudflare /api/submit-lead] 📡 CRM Response status: ${response.status} ${response.statusText}`);
    console.log(`[Cloudflare /api/submit-lead] CRM Response body:`, text);

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // plain text response
    }

    const isSuccess = response.ok || data?.result === "success" || Boolean(data?.id);
    const leadId = data?.id ?? data?.customer_id ?? null;

    console.log(`[Cloudflare /api/submit-lead] 📊 Lead received status: ${isSuccess ? '✅ YES (Lead received successfully by CRM)' : '❌ NO (Lead was not received or failed)'}`);
    if (leadId) {
      console.log(`[Cloudflare /api/submit-lead] 🆔 Lead Reference ID: ${leadId}`);
    }
    console.log("=======================================================\n");

    return json({
      success: isSuccess,
      received: isSuccess,
      message: isSuccess ? "Lead successfully received by CRM" : "Lead submission could not be processed",
      status: response.status,
      id: leadId,
      data,
      textExcerpt: data ? undefined : text.substring(0, 300),
    }, 200);
  } catch (err: any) {
    console.error("[Cloudflare /api/submit-lead] ❌ CRM proxy fetch error:", err);
    return json({
      success: false,
      received: false,
      message: "Failed to forward lead to CRM server",
      error: err?.message || "CRM request failed"
    }, 200);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
