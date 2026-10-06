import type { MlsGridProviderRecord } from "./common.js";

export type MlsGridOpenHouseRecord = MlsGridProviderRecord & {
  OpenHouseKey?: string;
  ListingKey?: string;
  ListingId?: string;
};
