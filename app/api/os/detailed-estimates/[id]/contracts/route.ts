import { NextRequest } from "next/server";
import { contractSourceRoute } from "../../../projects/_lib/contract-source";
type Params = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Params) { return contractSourceRoute(request, (await params).id); }
export async function POST(request: NextRequest, { params }: Params) { return contractSourceRoute(request, (await params).id); }
