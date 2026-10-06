import "server-only";
import type { MlsGridResource } from "./types/common.js";

export const MLS_GRID_CAPABILITY_MANIFEST = {
  provider: "MLS Grid",
  apiVersion: "v2",
  baseUrl: "https://api.mlsgrid.com/v2",
  originatingSystemName: "carolina",
  mlsSource: "Canopy MLS",
  organization: "Opzix LLC",
  uses: ["idx", "bo"],
  resources: ["Property", "Member", "Office", "OpenHouse"] satisfies MlsGridResource[],
  propertyExpansions: ["Media", "Rooms", "UnitTypes"],
  pagination: "@odata.nextLink",
  maximumPageSize: 5000,
  replicationCursor: "ModificationTimestamp",
  distributionRemovalFlag: "MlgCanView",
  recommendedIncrementalIntervalMinutes: 15,
  maximumRequestRatePerSecond: 2,
  notes: [
    "Media must be downloaded and served locally in a later specification.",
    "Resources and expansions must be verified against live metadata/provider responses before replication depends on them.",
    "IDX and BO subscriptions remain permission-separated and must not share credential assumptions.",
  ],
} as const;
