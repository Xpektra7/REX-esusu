import crypto from "node:crypto";
import type { NextResponse } from "next/server";

// Generates a short, url-safe correlation ID. 8 bytes → 11 chars base64url.
export function generateCorrelationId(): string {
  return crypto.randomBytes(8).toString("base64url");
}

// Attaches x-correlation-id to any NextResponse.
// Use as the final return wrapper in every route handler:
//   return withCorrelationId(success(...), correlationId);
export function withCorrelationId(
  response: NextResponse,
  correlationId: string,
): NextResponse {
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

// Convenience: generates + attaches in one call.
export function tracedResponse(
  response: NextResponse,
  correlationId?: string,
): NextResponse {
  const id = correlationId ?? generateCorrelationId();
  return withCorrelationId(response, id);
}
