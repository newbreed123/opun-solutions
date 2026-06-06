type SupabaseFetchOptions = {
  method?: "GET" | "POST" | "PATCH";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  prefer?: string;
};

type SupabaseFetchResult<T> =
  | {
      ok: true;
      data: T;
      status: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

export function getSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

export function hasSupabaseAdminConfig() {
  return getSupabaseAdminConfig() !== null;
}

export async function supabaseAdminFetch<T>(
  table: string,
  options: SupabaseFetchOptions = {},
): Promise<SupabaseFetchResult<T>> {
  const config = getSupabaseAdminConfig();

  if (!config) {
    return {
      ok: false,
      error: "Supabase admin environment variables are not configured.",
      status: 0,
    };
  }

  const endpoint = new URL(`${config.url}/rest/v1/${table}`);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      endpoint.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(endpoint, {
    method: options.method ?? "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data = text ? safeParseJson<T>(text) : (null as T);

  if (!response.ok) {
    return {
      ok: false,
      error:
        getSupabaseErrorMessage(data) ||
        `Supabase request failed with status ${response.status}.`,
      status: response.status,
    };
  }

  return {
    ok: true,
    data,
    status: response.status,
  };
}

function safeParseJson<T>(text: string) {
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

function getSupabaseErrorMessage(data: unknown) {
  if (typeof data !== "object" || data === null) {
    return "";
  }

  const payload = data as {
    message?: unknown;
    error?: unknown;
    hint?: unknown;
  };

  return [payload.message, payload.error, payload.hint]
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");
}
