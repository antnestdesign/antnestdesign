import { NextRequest } from "next/server";
import { handle } from "../../../projects/_lib/foundation";
type Params = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Params) { return handle(request, "save", (await params).id); }
