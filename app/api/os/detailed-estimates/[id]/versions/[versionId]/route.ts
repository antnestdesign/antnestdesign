import { NextRequest } from "next/server";
import { versionsRoute } from "../../../../projects/_lib/versions";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const values = await params; return versionsRoute(request, values.id, "get", values.versionId);
}
