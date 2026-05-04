export type FieldDefinition = {
  key: string;
  label: string;
  required?: boolean;
  aliases?: string[];
};

export type ValidationIssue = {
  field: string;
  message: string;
};

export type JsonResponseBody = {
  success: boolean;
  message?: string;
  error?: string;
  fields?: ValidationIssue[];
};

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function toCleanStringRecord(
  input: unknown,
  fields: FieldDefinition[],
) {
  if (!isPlainObject(input)) {
    return null;
  }

  return fields.reduce<Record<string, string>>((values, field) => {
    const keys = [field.key, ...(field.aliases ?? [])];
    const value = keys
      .map((key) => input[key])
      .find((candidate) => typeof candidate === "string");

    values[field.key] = typeof value === "string" ? value.trim() : "";
    return values;
  }, {});
}

export function getMissingRequiredFields(
  values: Record<string, string>,
  fields: FieldDefinition[],
) {
  return fields
    .filter((field) => field.required && !values[field.key])
    .map(({ key, label }) => ({ field: key, message: `${label} is required.` }));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidHttpUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function friendlyFieldList(issues: ValidationIssue[]) {
  const labels = issues.map((issue) => issue.message.replace(" is required.", ""));

  if (labels.length <= 1) {
    return labels[0] ?? "the required fields";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function buildFriendlyValidationError(issues: ValidationIssue[]) {
  const requiredIssues = issues.filter((issue) =>
    issue.message.endsWith("is required."),
  );
  const formatIssue = issues.find(
    (issue) => !issue.message.endsWith("is required."),
  );

  if (requiredIssues.length > 0) {
    return `Please fill in ${friendlyFieldList(requiredIssues)} before submitting.`;
  }

  return formatIssue?.message ?? "Please check the form and try again.";
}

export function methodNotAllowedResponse() {
  return {
    success: false,
    error: "Method not allowed. Please submit this endpoint with POST.",
  } satisfies JsonResponseBody;
}

export function logDevelopmentSubmission(
  formName: string,
  values: Record<string, string>,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log(`${formName} submission:`, {
    ...values,
    timestamp: new Date().toISOString(),
  });
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
