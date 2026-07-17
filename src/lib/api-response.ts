import { NextResponse } from "next/server";

const NO_CACHE = {
  headers: {
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
} as const;

export function success<T>(data: T, description = "Success") {
  return NextResponse.json({ code: "00", description, data }, NO_CACHE);
}

export function error(description: string, code = "01", status = 400) {
  return NextResponse.json(
    { code, description, data: null },
    { status, ...NO_CACHE },
  );
}

export function unauthorized(description = "Unauthorized") {
  return NextResponse.json(
    { code: "03", description, data: null },
    { status: 401, ...NO_CACHE },
  );
}

export function notFound(description = "Not found") {
  return NextResponse.json(
    { code: "04", description, data: null },
    { status: 404, ...NO_CACHE },
  );
}

export function conflict(description = "Conflict") {
  return NextResponse.json(
    { code: "05", description, data: null },
    { status: 409, ...NO_CACHE },
  );
}

export function handleApiError(e: unknown) {
  console.error("[API Error]", e);
  return error("An unexpected error occurred", "01", 500);
}

export function paginated<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  description = "Success",
) {
  return NextResponse.json(
    {
      code: "00",
      description,
      data: { items },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
    NO_CACHE,
  );
}
