export interface ApiErrorPayload {
  code: string;
  message: string;
  details: unknown[];
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown[];

  public constructor(statusCode: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const toApiErrorPayload = (error: ApiError): ApiErrorPayload => ({
  code: error.code,
  message: error.message,
  details: error.details,
});

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
