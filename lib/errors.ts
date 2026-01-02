export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number, stack?: string) {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    }
  }
}

export function handleApiError(error: any) {
  if (error instanceof ApiError) {
    return {
      body: { error: error.message },
      status: error.statusCode,
    };
  }
  console.error("Unknown API Error:", error);
  return {
    body: { error: "internal_server_error" },
    status: 500,
  };
}






































