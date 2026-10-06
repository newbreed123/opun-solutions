export type MlsGridUse = "idx" | "bo";

export type MlsGridResource = "Property" | "Member" | "Office" | "OpenHouse";

export type MlsGridPropertyExpansion = "Media" | "Rooms" | "UnitTypes";

export interface ODataResponse<T> {
  "@odata.context"?: string;
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  value: T[];
}

export type MlsGridProviderRecord = {
  OriginatingSystemName?: string;
  ModificationTimestamp?: string;
  MlgCanView?: boolean;
} & Record<string, unknown>;

export type MlsGridRequestLog = {
  resource: MlsGridResource | "$metadata";
  status: number;
  durationMs: number;
  requestId?: string;
  use?: MlsGridUse;
  queryShape?: Record<string, unknown>;
};

export type MlsGridFetch = typeof fetch;
