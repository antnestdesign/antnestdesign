import { NextRequest } from "next/server";
import { editorRoute } from "../../projects/_lib/editor";
export const GET = (request: NextRequest) => editorRoute(request);
