import type { MlsGridProviderRecord } from "./common.js";

export type MlsGridOfficeRecord = MlsGridProviderRecord & {
  OfficeKey?: string;
  OfficeMlsId?: string;
};
