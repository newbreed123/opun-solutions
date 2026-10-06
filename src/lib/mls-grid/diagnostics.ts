import "server-only";
import { createMlsGridClient } from "./client.js";
import { getMlsGridConfig } from "./config.js";
import { serializeMlsGridError } from "./errors.js";
import type {
  MlsGridRequestLog,
  MlsGridResource,
  MlsGridUse,
} from "./types/common.js";

const DIAGNOSTIC_RESOURCES: MlsGridResource[] = [
  "Property",
  "Member",
  "Office",
  "OpenHouse",
];

const REQUIRED_FIELDS: Record<MlsGridResource, string[]> = {
  Property: [
    "ListingKey",
    "ListingId",
    "OriginatingSystemName",
    "ModificationTimestamp",
    "MlgCanView",
  ],
  Member: ["MemberKey", "OriginatingSystemName", "ModificationTimestamp"],
  Office: ["OfficeKey", "OriginatingSystemName", "ModificationTimestamp"],
  OpenHouse: [
    "OpenHouseKey",
    "ListingKey",
    "OriginatingSystemName",
    "ModificationTimestamp",
  ],
};

export type MlsGridDiagnosticResourceResult = {
  resource: MlsGridResource | "$metadata";
  ok: boolean;
  available: boolean;
  status: number | null;
  durationMs: number | null;
  fieldNames: string[];
  requiredFields: Record<string, boolean>;
  nextLinkPresent: boolean;
  error?: ReturnType<typeof serializeMlsGridError>;
};

export type MlsGridDiagnosticReport = {
  provider: "MLS Grid";
  apiVersion: "v2";
  originatingSystemName: string | null;
  use: MlsGridUse;
  configOk: boolean;
  generatedAt: string;
  metadata: MlsGridDiagnosticResourceResult;
  resources: MlsGridDiagnosticResourceResult[];
};

export async function runMlsGridDiagnostics({
  use,
}: {
  use: MlsGridUse;
}): Promise<MlsGridDiagnosticReport> {
  const generatedAt = new Date().toISOString();
  let originatingSystemName: string | null = null;

  try {
    const config = getMlsGridConfig({ use });
    originatingSystemName = config.originatingSystemName;
  } catch (error) {
    return {
      provider: "MLS Grid",
      apiVersion: "v2",
      originatingSystemName,
      use,
      configOk: false,
      generatedAt,
      metadata: diagnosticFailure("$metadata", error),
      resources: DIAGNOSTIC_RESOURCES.map((resource) =>
        diagnosticFailure(resource, error),
      ),
    };
  }

  const requestLogs: MlsGridRequestLog[] = [];
  const client = createMlsGridClient({
    use,
    onRequestLog: (entry) => requestLogs.push(entry),
  });

  const metadata = await runMetadataCheck(client.getMetadata, requestLogs);
  const resources = [];
  for (const resource of DIAGNOSTIC_RESOURCES) {
    resources.push(
      await runResourceCheck(
        resource,
        () => client.requestResource({ resource, top: 1 }),
        requestLogs,
      ),
    );
  }

  return {
    provider: "MLS Grid",
    apiVersion: "v2",
    originatingSystemName,
    use,
    configOk: true,
    generatedAt,
    metadata,
    resources,
  };
}

async function runMetadataCheck(
  getMetadata: () => Promise<string>,
  requestLogs: MlsGridRequestLog[],
) {
  const before = requestLogs.length;
  try {
    const metadata = await getMetadata();
    const log = requestLogs.slice(before).at(-1);
    return {
      resource: "$metadata",
      ok: metadata.length > 0,
      available: metadata.length > 0,
      status: log?.status ?? null,
      durationMs: log?.durationMs ?? null,
      fieldNames: [],
      requiredFields: {},
      nextLinkPresent: false,
    } satisfies MlsGridDiagnosticResourceResult;
  } catch (error) {
    const log = requestLogs.slice(before).at(-1);
    return diagnosticFailure("$metadata", error, log);
  }
}

async function runResourceCheck(
  resource: MlsGridResource,
  request: () => Promise<{ value: Array<Record<string, unknown>>; "@odata.nextLink"?: string }>,
  requestLogs: MlsGridRequestLog[],
) {
  const before = requestLogs.length;
  try {
    const response = await request();
    const firstRecord = response.value[0] ?? {};
    const fieldNames = Object.keys(firstRecord).sort();
    const log = requestLogs.slice(before).at(-1);
    return {
      resource,
      ok: true,
      available: response.value.length > 0,
      status: log?.status ?? null,
      durationMs: log?.durationMs ?? null,
      fieldNames,
      requiredFields: Object.fromEntries(
        REQUIRED_FIELDS[resource].map((field) => [
          field,
          fieldNames.includes(field),
        ]),
      ),
      nextLinkPresent: Boolean(response["@odata.nextLink"]),
    } satisfies MlsGridDiagnosticResourceResult;
  } catch (error) {
    const log = requestLogs.slice(before).at(-1);
    return diagnosticFailure(resource, error, log);
  }
}

function diagnosticFailure(
  resource: MlsGridResource | "$metadata",
  error: unknown,
  log?: MlsGridRequestLog,
) {
  return {
    resource,
    ok: false,
    available: false,
    status: log?.status ?? null,
    durationMs: log?.durationMs ?? null,
    fieldNames: [],
    requiredFields: resource === "$metadata" ? {} : missingRequiredFields(resource),
    nextLinkPresent: false,
    error: serializeMlsGridError(error),
  } satisfies MlsGridDiagnosticResourceResult;
}

function missingRequiredFields(resource: MlsGridResource) {
  return Object.fromEntries(REQUIRED_FIELDS[resource].map((field) => [field, false]));
}
