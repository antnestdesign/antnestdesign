import { NextRequest } from "next/server";
import { handle } from "../_lib/foundation";
export const GET = (request: NextRequest) => handle(request, "customers");
