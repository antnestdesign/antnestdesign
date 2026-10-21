import { NextRequest } from "next/server";
import { handle } from "../_lib/foundation";
type Params = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Params) { return handle(request, "project", (await params).id); }
