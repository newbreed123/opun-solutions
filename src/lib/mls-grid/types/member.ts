import type { MlsGridProviderRecord } from "./common.js";

export type MlsGridMemberRecord = MlsGridProviderRecord & {
  MemberKey?: string;
  MemberMlsId?: string;
  MemberEmail?: string;
};
