import "server-only";
import { getMlsGridConfig, type MlsGridConfig } from "./config.js";
import { MlsGridError } from "./errors.js";
import {
  MlsGridRequestScheduler,
  validateMlsGridNextLink,
} from "./pagination.js";
import {
  buildMlsGridQuery,
  type MlsGridQueryInput,
} from "./query.js";
import { safeQueryShape } from "./redaction.js";
import type { MlsGridMemberRecord } from "./types/member.js";
import type { MlsGridOfficeRecord } from "./types/office.js";
import type { MlsGridOpenHouseRecord } from "./types/open-house.js";
import type { MlsGridPropertyRecord } from "./types/property.js";
import type {
  MlsGridFetch,
  MlsGridRequestLog,
  MlsGridResource,
  MlsGridUse,
  ODataResponse,
} from "./types/common.js";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_PAGES = 100;

export type MlsGridResourceQueryInput = Omit<
  MlsGridQueryInput,
  "originatingSystemName"
>;

export type CreateMlsGridClientOptions = {
  use: MlsGridUse;
  fetchImpl?: MlsGridFetch;
  scheduler?: MlsGridRequestScheduler;
  timeoutMs?: number;
  onRequestLog?: (entry: MlsGridRequestLog) => void;
};

export type MlsGridPaginationOptions = {
  maxPages?: number;
};

export type MlsGridClient = {
  use: MlsGridUse;
  getMetadata: () => Promise<string>;
  requestResource: <T>(
    input: MlsGridResourceQueryInput,
  ) => Promise<ODataResponse<T>>;
  paginateResource: <T>(
    input: MlsGridResourceQueryInput,
    options?: MlsGridPaginationOptions,
  ) => Promise<ODataResponse<T>>;
  getProperties: (
    input?: Omit<MlsGridResourceQueryInput, "resource">,
  ) => Promise<ODataResponse<MlsGridPropertyRecord>>;
  getMembers: (
    input?: Omit<MlsGridResourceQueryInput, "resource" | "expand">,
  ) => Promise<ODataResponse<MlsGridMemberRecord>>;
  getOffices: (
    input?: Omit<MlsGridResourceQueryInput, "resource" | "expand">,
  ) => Promise<ODataResponse<MlsGridOfficeRecord>>;
  getOpenHouses: (
    input?: Omit<MlsGridResourceQueryInput, "resource" | "expand">,
  ) => Promise<ODataResponse<MlsGridOpenHouseRecord>>;
};

export function createMlsGridClient(
  options: CreateMlsGridClientOptions,
): MlsGridClient {
  const config = getMlsGridConfig({ use: options.use });
  const fetchImpl = options.fetchImpl ?? fetch;
  const scheduler = options.scheduler ?? new MlsGridRequestScheduler();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function getMetadata() {
    const url = new URL(`${config.baseUrl}/$metadata`);
    const response = await requestMlsGrid({
      config,
      fetchImpl,
      scheduler,
      timeoutMs,
      url,
      resource: "$metadata",
      accept: "application/xml,text/xml,*/*",
      onRequestLog: options.onRequestLog,
    });
    return response.text();
  }

  async function requestResource<T>(input: MlsGridResourceQueryInput) {
    const builtQuery = buildMlsGridQuery({
      ...input,
      originatingSystemName: config.originatingSystemName,
    });
    const url = buildResourceUrl(config.baseUrl, builtQuery.path, builtQuery.params);
    const response = await requestMlsGrid({
      config,
      fetchImpl,
      scheduler,
      timeoutMs,
      url,
      resource: input.resource,
      accept: "application/json",
      queryShape: builtQuery.queryShape,
      onRequestLog: options.onRequestLog,
    });
    return parseODataResponse<T>(response, input.resource);
  }

  async function paginateResource<T>(
    input: MlsGridResourceQueryInput,
    paginationOptions: MlsGridPaginationOptions = {},
  ) {
    const maxPages = paginationOptions.maxPages ?? DEFAULT_MAX_PAGES;
    if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > DEFAULT_MAX_PAGES) {
      throw new MlsGridError({
        code: "invalid_query",
        message: `maxPages must be an integer between 1 and ${DEFAULT_MAX_PAGES}.`,
      });
    }

    const firstPage = await requestResource<T>(input);
    const values = [...firstPage.value];
    let nextLink = firstPage["@odata.nextLink"];
    let pageCount = 1;

    while (nextLink) {
      if (pageCount >= maxPages) {
        throw new MlsGridError({
          code: "invalid_query",
          message: "MLS Grid pagination exceeded the configured page limit.",
          details: { maxPages },
        });
      }

      const nextUrl = validateMlsGridNextLink(nextLink, config.baseUrl);
      const response = await requestMlsGrid({
        config,
        fetchImpl,
        scheduler,
        timeoutMs,
        url: nextUrl,
        resource: input.resource,
        accept: "application/json",
        queryShape: { resource: input.resource, page: "nextLink" },
        onRequestLog: options.onRequestLog,
      });
      const page = await parseODataResponse<T>(response, input.resource);
      values.push(...page.value);
      nextLink = page["@odata.nextLink"];
      pageCount += 1;
    }

    return {
      "@odata.context": firstPage["@odata.context"],
      "@odata.count": firstPage["@odata.count"],
      value: values,
    } satisfies ODataResponse<T>;
  }

  return {
    use: options.use,
    getMetadata,
    requestResource,
    paginateResource,
    getProperties: (input = {}) =>
      requestResource<MlsGridPropertyRecord>({ ...input, resource: "Property" }),
    getMembers: (input = {}) =>
      requestResource<MlsGridMemberRecord>({ ...input, resource: "Member" }),
    getOffices: (input = {}) =>
      requestResource<MlsGridOfficeRecord>({ ...input, resource: "Office" }),
    getOpenHouses: (input = {}) =>
      requestResource<MlsGridOpenHouseRecord>({
        ...input,
        resource: "OpenHouse",
      }),
  };
}

async function requestMlsGrid({
  config,
  fetchImpl,
  scheduler,
  timeoutMs,
  url,
  resource,
  accept,
  queryShape,
  onRequestLog,
}: {
  config: MlsGridConfig;
  fetchImpl: MlsGridFetch;
  scheduler: MlsGridRequestScheduler;
  timeoutMs: number;
  url: URL;
  resource: MlsGridResource | "$metadata";
  accept: string;
  queryShape?: Record<string, unknown>;
  onRequestLog?: (entry: MlsGridRequestLog) => void;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    await scheduler.waitForTurn();
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: accept,
        "Accept-Encoding": "gzip, deflate",
        Authorization: `Bearer ${config.accessToken}`,
      },
      signal: controller.signal,
    });
    onRequestLog?.({
      resource,
      status: response.status,
      durationMs: Date.now() - startedAt,
      requestId: response.headers.get("x-request-id") ?? undefined,
      use: config.use,
      queryShape: queryShape ? safeQueryShape(queryShape) : undefined,
    });

    if (!response.ok) {
      throw httpStatusToMlsGridError(response.status, resource);
    }

    return response;
  } catch (error) {
    if (isAbortError(error)) {
      throw new MlsGridError({
        code: "provider_timeout",
        status: 504,
        message: "MLS Grid request timed out.",
        details: { resource },
      });
    }
    if (error instanceof MlsGridError) {
      throw error;
    }
    throw new MlsGridError({
      code: "upstream_server_failure",
      message: "MLS Grid request failed before a provider response was returned.",
      details: { resource },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseODataResponse<T>(response: Response, resource: MlsGridResource) {
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new MlsGridError({
      code: "malformed_provider_response",
      status: response.status,
      message: "MLS Grid returned malformed JSON.",
      details: { resource },
    });
  }

  if (!isODataResponse<T>(parsed)) {
    throw new MlsGridError({
      code: "malformed_provider_response",
      status: response.status,
      message: "MLS Grid returned an unexpected OData response shape.",
      details: { resource },
    });
  }

  return parsed;
}

function isODataResponse<T>(value: unknown): value is ODataResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as ODataResponse<T>).value)
  );
}

function buildResourceUrl(
  baseUrl: string,
  path: string,
  params: URLSearchParams,
) {
  const url = new URL(`${baseUrl}/${path}`);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return url;
}

function httpStatusToMlsGridError(
  status: number,
  resource: MlsGridResource | "$metadata",
) {
  if (status === 401) {
    return new MlsGridError({
      code: "authentication_failure",
      status,
      message: "MLS Grid authentication failed.",
      details: { resource },
    });
  }
  if (status === 403) {
    return new MlsGridError({
      code: "authorization_failure",
      status,
      message: "MLS Grid authorization failed for the requested resource.",
      details: { resource },
    });
  }
  if (status === 429) {
    return new MlsGridError({
      code: "rate_limited",
      status,
      message: "MLS Grid rate limit was reached.",
      details: { resource },
    });
  }
  if (status >= 500) {
    return new MlsGridError({
      code: "upstream_server_failure",
      status,
      message: "MLS Grid returned an upstream server error.",
      details: { resource },
    });
  }
  return new MlsGridError({
    code: "invalid_query",
    status,
    message: "MLS Grid rejected the request.",
    details: { resource },
  });
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
