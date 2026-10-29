import { NextRequest } from "next/server";
import { editorRoute } from "../../../../projects/_lib/editor";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return editorRoute(request, (await params).id, true); }
