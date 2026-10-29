import { NextRequest } from "next/server";
import { versionsRoute } from "../../../../projects/_lib/versions";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return versionsRoute(request, (await params).id, "preview"); }
