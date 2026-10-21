import { NextRequest } from "next/server";
import { handle } from "../../../projects/_lib/foundation";
export const POST = (request: NextRequest) => handle(request, "preview");
