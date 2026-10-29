import { NextRequest } from "next/server";
import { contractSourceRoute } from "../_lib/contract-source";
export async function GET(request: NextRequest) { return contractSourceRoute(request); }
