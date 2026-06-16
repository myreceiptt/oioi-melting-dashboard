import { NextResponse } from "next/server";

const apiNotFoundPayload = {
  ok: false,
  code: "OIOI_API_NOWHERE",
  error: "This OiOi API path does not point to a known endpoint.",
  hint: "Try /api/rewards/rounds, /api/rewards/proof, or another documented OiOi endpoint.",
};

export function GET() {
  return NextResponse.json(apiNotFoundPayload, { status: 404 });
}

export function POST() {
  return NextResponse.json(apiNotFoundPayload, { status: 404 });
}

export function PUT() {
  return NextResponse.json(apiNotFoundPayload, { status: 404 });
}

export function PATCH() {
  return NextResponse.json(apiNotFoundPayload, { status: 404 });
}

export function DELETE() {
  return NextResponse.json(apiNotFoundPayload, { status: 404 });
}
