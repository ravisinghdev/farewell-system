export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(
    message: string,
    status: number = 400,
    code?: string,
    details?: any
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      body: {
        error: err.message,
        code: err.code,
        details: err.details,
      },
    };
  }

  console.error("UNHANDLED API ERROR:", err);

  return {
    status: 500,
    body: { error: "internal_error" },
  };
}
