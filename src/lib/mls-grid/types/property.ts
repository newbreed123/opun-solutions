import type { MlsGridProviderRecord } from "./common.js";
import type { MlsGridMediaRecord } from "./media.js";

export type MlsGridPropertyRecord = MlsGridProviderRecord & {
  ListingKey?: string;
  ListingId?: string;
  Media?: MlsGridMediaRecord[];
  Rooms?: Array<Record<string, unknown>>;
  UnitTypes?: Array<Record<string, unknown>>;
};
