export type ActivationDiagnosticCode =
  | "supabase_api_key_invalid"
  | "invite_token_invalid"
  | "invite_token_expired"
  | "invitation_record_invalid"
  | "membership_activation_failed"
  | "auth_request_failed"
  | "auth_transport_error"
  | "supabase_config_missing";

type ActivationDiagnostic = {
  stage:
    | "token_verification"
    | "auth_user_lookup"
    | "invitation_validation"
    | "password_update"
    | "membership_activation";
  method: "GET" | "POST" | "PUT";
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
};

export function logCustomerInvitationActivationFailure(
  diagnostic: ActivationDiagnostic,
) {
  console.warn({
    event: "customer_invitation_activation_failed",
    ...diagnostic,
  });
}
