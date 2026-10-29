import { NextRequest } from "next/server";
import { editorRoute } from "../../../projects/_lib/editor";
type Params = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Params) { return editorRoute(request, (await params).id); }
export async function PATCH(request: NextRequest, { params }: Params) { return editorRoute(request, (await params).id); }
