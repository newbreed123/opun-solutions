export type ActivationDiagnosticCode =
  | "supabase_api_key_invalid"
  | "invite_token_invalid"
  | "invite_token_expired"
  | "invitation_record_invalid"
  | "membership_activation_failed"
  | "session_establishment_failed"
  | "activation_complete"
  | "auth_request_failed"
  | "auth_transport_error"
  | "supabase_config_missing";

export type CustomerAuthDiagnosticCode =
  | ActivationDiagnosticCode
  | "password_recovery_failed";

type ActivationDiagnostic = {
  stage:
    | "token_verification"
    | "auth_user_lookup"
    | "invitation_validation"
    | "password_update"
    | "membership_activation"
    | "session_establishment"
    | "activation_complete";
  method: "GET" | "POST" | "PUT" | null;
  endpoint: string;
  status: number | null;
  diagnosticCode: ActivationDiagnosticCode;
  keySource:
    | "SUPABASE_ANON_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | "SUPABASE_SERVICE_ROLE_KEY"
    | null;
  urlSource:
    | "SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_URL"
    | null;
  requestMetadata?: {
    hasApiKey?: boolean;
    hasAccessToken?: boolean;
    hasRefreshToken?: boolean;
    hasUser?: boolean;
    accessTokenLooksLikeJwt?: boolean;
    verifiedUserIdPresent?: boolean;
    apiKeySource?:
      | "SUPABASE_ANON_KEY"
      | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      | "SUPABASE_SERVICE_ROLE_KEY";
    bearerSource?: "verified_access_token" | "service_role_key";
    sameSupabaseHost?: boolean;
    upstreamCode?: string | null;
    upstreamMessage?: string | null;
    normalizedDiagnosticCode?: ActivationDiagnosticCode;
  };
};

type CustomerAuthDiagnostic = {
  stage: "password_recovery";
  method: "POST" | null;
  endpoint: string;
  status: number | null;
  diagnosticCode: CustomerAuthDiagnosticCode;
  keySource:
    | "SUPABASE_ANON_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | null;
  urlSource:
    | "SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_URL"
    | null;
  requestMetadata?: {
    apiKeySource?: "SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
    redirectHost?: string | null;
    redirectPathname?: string | null;
    sameSupabaseHost?: boolean;
    upstreamCode?: string | null;
    upstreamMessage?: string | null;
    normalizedDiagnosticCode?: CustomerAuthDiagnosticCode;
  };
};

export function logCustomerInvitationActivationFailure(
  diagnostic: ActivationDiagnostic,
) {
  console.warn({
    event: "customer_invitation_activation_failed",
    ...diagnostic,
  });
}

export function logCustomerInvitationActivationEvent(
  diagnostic: ActivationDiagnostic,
) {
  console.info({
    event: "customer_invitation_activation_event",
    ...diagnostic,
  });
}

export function logCustomerAuthFailure(diagnostic: CustomerAuthDiagnostic) {
  console.warn({
    event: "customer_auth_failed",
    ...diagnostic,
  });
}
