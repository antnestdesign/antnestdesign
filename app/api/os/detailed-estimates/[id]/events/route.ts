import { NextRequest } from "next/server";
import { handle } from "../../../projects/_lib/foundation";
type Params = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Params) { return handle(request, "events", (await params).id); }
