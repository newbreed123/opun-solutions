import "server-only";
import { MlsGridError } from "./errors.js";
import type {
  MlsGridPropertyExpansion,
  MlsGridResource,
} from "./types/common.js";

const ALLOWED_STANDARD_STATUSES = new Set([
  "Active",
  "ActiveUnderContract",
  "ComingSoon",
  "Pending",
  "Closed",
  "Withdrawn",
  "Canceled",
  "Expired",
]);

const RESOURCE_SELECT_FIELDS: Record<MlsGridResource, Set<string>> = {
  Property: new Set([
    "ListingKey",
    "ListingId",
    "OriginatingSystemName",
    "ModificationTimestamp",
    "MlgCanView",
    "StandardStatus",
  ]),
  Member: new Set([
    "MemberKey",
    "MemberMlsId",
    "OriginatingSystemName",
    "ModificationTimestamp",
    "MlgCanView",
  ]),
  Office: new Set([
    "OfficeKey",
    "OfficeMlsId",
    "OriginatingSystemName",
    "ModificationTimestamp",
    "MlgCanView",
  ]),
  OpenHouse: new Set([
    "OpenHouseKey",
    "ListingKey",
    "ListingId",
    "OriginatingSystemName",
    "ModificationTimestamp",
    "MlgCanView",
  ]),
};

const PROPERTY_EXPANSIONS = new Set<MlsGridPropertyExpansion>([
  "Media",
  "Rooms",
  "UnitTypes",
]);

export type MlsGridFilter =
  | { type: "modificationTimestampGt"; timestamp: string }
  | { type: "mlgCanView"; value: boolean }
  | { type: "standardStatus"; value: string }
  | { type: "listingId"; value: string }
  | { type: "listingIdIn"; values: string[] };

export type MlsGridQueryInput = {
  resource: MlsGridResource;
  originatingSystemName: string;
  filters?: MlsGridFilter[];
  select?: string[];
  expand?: MlsGridPropertyExpansion[];
  top?: number;
  skip?: number;
  count?: boolean;
};

export type BuiltMlsGridQuery = {
  path: string;
  params: URLSearchParams;
  queryShape: Record<string, unknown>;
};

export function buildMlsGridQuery(input: MlsGridQueryInput): BuiltMlsGridQuery {
  validateResource(input.resource);

  const filters = [
    `OriginatingSystemName eq '${escapeODataString(input.originatingSystemName)}'`,
    ...(input.filters ?? []).map(filterToOData),
  ];
  const params = new URLSearchParams();
  params.set("$filter", filters.join(" and "));

  if (input.select?.length) {
    params.set("$select", validateSelect(input.resource, input.select).join(","));
  }

  if (input.expand?.length) {
    if (input.resource !== "Property") {
      throw new MlsGridError({
        code: "invalid_query",
        message: "$expand is only supported by this client for Property requests.",
      });
    }
    params.set("$expand", validatePropertyExpansions(input.expand).join(","));
  }

  if (input.top !== undefined) {
    validateIntegerRange("$top", input.top, 1, 5000);
    params.set("$top", String(input.top));
  }

  if (input.skip !== undefined) {
    validateIntegerRange("$skip", input.skip, 0, Number.MAX_SAFE_INTEGER);
    params.set("$skip", String(input.skip));
  }

  if (input.count !== undefined) {
    params.set("$count", input.count ? "true" : "false");
  }

  return {
    path: input.resource,
    params,
    queryShape: {
      resource: input.resource,
      hasOriginatingSystemFilter: true,
      filterTypes: (input.filters ?? []).map((filter) => filter.type),
      select: input.select ?? [],
      expand: input.expand ?? [],
      top: input.top,
      skip: input.skip,
      count: input.count,
    },
  };
}

function validateResource(resource: string): asserts resource is MlsGridResource {
  if (!["Property", "Member", "Office", "OpenHouse"].includes(resource)) {
    throw new MlsGridError({
      code: "invalid_query",
      message: `Unsupported MLS Grid resource: ${resource}.`,
    });
  }
}

function filterToOData(filter: MlsGridFilter) {
  switch (filter.type) {
    case "modificationTimestampGt":
      return `ModificationTimestamp gt ${validateTimestamp(filter.timestamp)}`;
    case "mlgCanView":
      return `MlgCanView eq ${filter.value ? "true" : "false"}`;
    case "standardStatus":
      if (!ALLOWED_STANDARD_STATUSES.has(filter.value)) {
        throw new MlsGridError({
          code: "invalid_query",
          message: "Unsupported StandardStatus filter value.",
        });
      }
      return `StandardStatus eq '${filter.value}'`;
    case "listingId":
      return `ListingId eq '${escapeODataString(validateIdentifier(filter.value))}'`;
    case "listingIdIn":
      if (filter.values.length === 0 || filter.values.length > 100) {
        throw new MlsGridError({
          code: "invalid_query",
          message: "ListingId in filters must contain 1 to 100 identifiers.",
        });
      }
      return `ListingId in (${filter.values
        .map((value) => `'${escapeODataString(validateIdentifier(value))}'`)
        .join(",")})`;
  }
}

function validateTimestamp(timestamp: string) {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    throw new MlsGridError({
      code: "invalid_query",
      message: "ModificationTimestamp filter must be an ISO timestamp.",
    });
  }
  return new Date(parsed).toISOString();
}

function validateIdentifier(value: string) {
  if (!/^[A-Za-z0-9._:-]{1,80}$/.test(value)) {
    throw new MlsGridError({
      code: "invalid_query",
      message: "Listing identifiers may contain only safe identifier characters.",
    });
  }
  return value;
}

function validateSelect(resource: MlsGridResource, fields: string[]) {
  const allowed = RESOURCE_SELECT_FIELDS[resource];
  for (const field of fields) {
    if (!allowed.has(field)) {
      throw new MlsGridError({
        code: "invalid_query",
        message: `Unsupported $select field for ${resource}: ${field}.`,
      });
    }
  }
  return Array.from(new Set(fields));
}

function validatePropertyExpansions(expansions: MlsGridPropertyExpansion[]) {
  for (const expansion of expansions) {
    if (!PROPERTY_EXPANSIONS.has(expansion)) {
      throw new MlsGridError({
        code: "invalid_query",
        message: `Unsupported Property expansion: ${expansion}.`,
      });
    }
  }
  return Array.from(new Set(expansions));
}

function validateIntegerRange(
  label: "$top" | "$skip",
  value: number,
  min: number,
  max: number,
) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new MlsGridError({
      code: "invalid_query",
      message: `${label} must be an integer between ${min} and ${max}.`,
    });
  }
}

function escapeODataString(value: string) {
  return value.replace(/'/g, "''");
}
