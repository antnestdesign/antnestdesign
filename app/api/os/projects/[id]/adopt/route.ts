import { NextRequest } from "next/server";
import { handle } from "../../_lib/foundation";
type Params = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, { params }: Params) { return handle(request, "adopt-project", (await params).id); }
