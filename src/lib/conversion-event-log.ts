import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";

export type ConversionEventRow = {
  id: string;
  created_at: string;
  event_name: string;
  source: string | null;
  page_path: string | null;
  website_url: string | null;
  scan_id: string | null;
  business_type: string | null;
  challenge: string | null;
  industry: string | null;
  lead_score: number | null;
  lead_temperature: string | null;
  session_id: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  gclid: string | null;
  payload: Record<string, unknown> | null;
};

type ConversionEventInput = {
  eventName: string;
  payload: Record<string, unknown>;
  userAgent?: string | null;
};

type ConversionEventQuery = {
  from?: string;
  to?: string;
};

const FULL_SELECT =
  "id,created_at,event_name,source,page_path,website_url,scan_id,business_type,challenge,industry,lead_score,lead_temperature,session_id,utm_campaign,utm_source,utm_medium,gclid,payload";
const MINIMAL_SELECT = "id,created_at,event_name,payload";

export async function logConversionEvent(input: ConversionEventInput) {
  if (!hasSupabaseAdminConfig()) {
    return { ok: false as const, skipped: true, error: "not-configured" };
  }

  const body = conversionEventBody(input);
  const result = await supabaseAdminFetch<null>("conversion_events", {
    method: "POST",
    body,
    prefer: "returning=minimal",
  });

  if (result.ok) {
    return { ok: true as const, skipped: false };
  }

  const fallback = await supabaseAdminFetch<null>("conversion_events", {
    method: "POST",
    body: {
      event_name: input.eventName,
      payload: {
        ...input.payload,
        userAgent: input.userAgent || undefined,
      },
    },
    prefer: "returning=minimal",
  });

  return fallback.ok
    ? { ok: true as const, skipped: false }
    : {
        ok: false as const,
        skipped: false,
        error: fallback.error || result.error,
      };
}

export async function listConversionEvents(
  limit = 1000,
  range: ConversionEventQuery = {},
) {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as ConversionEventRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  const query = withCreatedAtRange(
    {
      select: FULL_SELECT,
      order: "created_at.desc",
      limit,
    },
    range,
  );
  const result = await supabaseAdminFetch<ConversionEventRow[]>(
    "conversion_events",
    { query },
  );

  if (result.ok) {
    return { ok: true as const, data: normalizeRows(result.data) };
  }

  const fallback = await supabaseAdminFetch<Array<Partial<ConversionEventRow>>>(
    "conversion_events",
    {
      query: withCreatedAtRange(
        {
          select: MINIMAL_SELECT,
          order: "created_at.desc",
          limit,
        },
        range,
      ),
    },
  );

  if (!fallback.ok) {
    return {
      ok: false as const,
      data: [] as ConversionEventRow[],
      error: fallback.error || result.error,
    };
  }

  return {
    ok: true as const,
    data: normalizeRows(fallback.data),
    warning:
      "conversion_events is missing optional dashboard columns. Showing payload fallbacks where possible.",
  };
}

function conversionEventBody({ eventName, payload, userAgent }: ConversionEventInput) {
  return {
    event_name: eventName,
    source: stringValue(payload.source),
    page_path: stringValue(payload.pagePath),
    website_url: stringValue(payload.websiteUrl),
    scan_id: stringValue(payload.scanId),
    business_type: stringValue(payload.businessType),
    challenge: stringValue(payload.challenge),
    industry: stringValue(payload.industry),
    lead_score: numberValue(payload.leadScore),
    lead_temperature: stringValue(payload.leadTemperature),
    session_id: stringValue(payload.sessionId),
    utm_campaign: stringValue(payload.utmCampaign),
    utm_source: stringValue(payload.utmSource),
    utm_medium: stringValue(payload.utmMedium),
    gclid: stringValue(payload.gclid),
    payload: {
      ...payload,
      userAgent: userAgent || undefined,
    },
  };
}

function normalizeRows(rows: Array<Partial<ConversionEventRow>>): ConversionEventRow[] {
  return rows.map((row) => {
    const payload = isRecord(row.payload) ? row.payload : {};

    return {
      id: stringValue(row.id) || `${row.event_name}-${row.created_at}`,
      created_at: stringValue(row.created_at) || new Date(0).toISOString(),
      event_name: stringValue(row.event_name) || "unknown",
      source: stringValue(row.source) || stringValue(payload.source),
      page_path: stringValue(row.page_path) || stringValue(payload.pagePath),
      website_url: stringValue(row.website_url) || stringValue(payload.websiteUrl),
      scan_id: stringValue(row.scan_id) || stringValue(payload.scanId),
      business_type:
        stringValue(row.business_type) || stringValue(payload.businessType),
      challenge: stringValue(row.challenge) || stringValue(payload.challenge),
      industry: stringValue(row.industry) || stringValue(payload.industry),
      lead_score: numberValue(row.lead_score) ?? numberValue(payload.leadScore),
      lead_temperature:
        stringValue(row.lead_temperature) || stringValue(payload.leadTemperature),
      session_id: stringValue(row.session_id) || stringValue(payload.sessionId),
      utm_campaign:
        stringValue(row.utm_campaign) || stringValue(payload.utmCampaign),
      utm_source: stringValue(row.utm_source) || stringValue(payload.utmSource),
      utm_medium: stringValue(row.utm_medium) || stringValue(payload.utmMedium),
      gclid: stringValue(row.gclid) || stringValue(payload.gclid),
      payload,
    };
  });
}

function withCreatedAtRange<T extends Record<string, string | number>>(
  query: T,
  { from, to }: ConversionEventQuery,
) {
  const fromIso = validDate(from);
  const toIso = validDate(to);

  if (fromIso && toIso) {
    return {
      ...query,
      and: `(created_at.gte.${fromIso},created_at.lte.${toIso})`,
    };
  }

  if (fromIso) {
    return { ...query, created_at: `gte.${fromIso}` };
  }

  if (toIso) {
    return { ...query, created_at: `lte.${toIso}` };
  }

  return query;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value: unknown) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}
