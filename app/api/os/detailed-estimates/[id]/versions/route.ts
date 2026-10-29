import { NextRequest } from "next/server";
import { versionsRoute } from "../../../projects/_lib/versions";
type Params = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Params) { return versionsRoute(request, (await params).id, "list"); }
export async function POST(request: NextRequest, { params }: Params) { return versionsRoute(request, (await params).id, "issue"); }
