import type { MlsGridProviderRecord } from "./common.js";

export type MlsGridMediaRecord = MlsGridProviderRecord & {
  MediaKey?: string;
  ResourceRecordKey?: string;
  MediaURL?: string;
  Order?: number;
};
