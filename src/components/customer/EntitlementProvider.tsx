"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { Entitlement } from "@/lib/customer-platform/types";

type EntitlementContextValue = {
  entitlements: Entitlement[];
  canAccess: (featureCode: string) => boolean;
  accessLevel: (featureCode: string) => Entitlement["accessLevel"];
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({
  entitlements,
  children,
}: {
  entitlements: Entitlement[];
  children: ReactNode;
}) {
  const value: EntitlementContextValue = {
    entitlements,
    canAccess(featureCode) {
      return entitlements.some(
        (entitlement) =>
          entitlement.featureCode === featureCode &&
          entitlement.accessLevel !== "unavailable",
      );
    },
    accessLevel(featureCode) {
      return (
        entitlements.find((entitlement) => entitlement.featureCode === featureCode)
          ?.accessLevel ?? "unavailable"
      );
    },
  };

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const value = useContext(EntitlementContext);
  if (!value) {
    throw new Error("useEntitlements must be used inside EntitlementProvider.");
  }
  return value;
}
