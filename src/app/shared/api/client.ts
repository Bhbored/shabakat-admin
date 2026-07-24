export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

interface ProblemDetails {
  detail?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
  console.warn("VITE_API_URL is not configured. API requests will fail until the env var is set.");
}

export const apiBaseUrl = rawApiUrl?.replace(/\/+$/, "") ?? "";

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function toApiErrorResponse(response: Response) {
  let payload: ProblemDetails | undefined;

  try {
    payload = (await response.json()) as ProblemDetails;
  } catch {
    payload = undefined;
  }

  const validationMessage = payload?.errors
    ? Object.values(payload.errors).flat().join(" ")
    : undefined;

  return new ApiError(
    payload?.detail || validationMessage || payload?.title || "Request failed.",
    response.status,
    payload?.errors,
  );
}

async function toApiError(response: Response) {
  return toApiErrorResponse(response);
}
