import { NextResponse } from "next/server";

type MissingRouteContext = {
  params: Promise<{ missing: string[] }>;
};

function apiMissingResponse(method: string, missing: string[]) {
  return NextResponse.json(
    {
      ok: false,
      code: "OIOI_API_PORTAL_MISFIRED",
      error: "This OiOi API endpoint is not available.",
      method,
      path: `/api/${missing.join("/")}`,
      hint: "The dashboard is listening, but this API doorway is not one of its doors.",
    },
    { status: 404 },
  );
}

export async function GET(_request: Request, { params }: MissingRouteContext) {
  const { missing } = await params;
  return apiMissingResponse("GET", missing);
}

export async function POST(_request: Request, { params }: MissingRouteContext) {
  const { missing } = await params;
  return apiMissingResponse("POST", missing);
}

export async function PUT(_request: Request, { params }: MissingRouteContext) {
  const { missing } = await params;
  return apiMissingResponse("PUT", missing);
}

export async function PATCH(
  _request: Request,
  { params }: MissingRouteContext,
) {
  const { missing } = await params;
  return apiMissingResponse("PATCH", missing);
}

export async function DELETE(
  _request: Request,
  { params }: MissingRouteContext,
) {
  const { missing } = await params;
  return apiMissingResponse("DELETE", missing);
}
