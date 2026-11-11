import {NextRequest} from 'next/server';
import {confirmationGet,confirmationPost} from '../../_lib/confirmation';
type Route={params:Promise<{id:string}>};
export async function GET(request:NextRequest,route:Route){return confirmationGet(request,(await route.params).id);}
export async function POST(request:NextRequest,route:Route){return confirmationPost(request,(await route.params).id,'confirm');}
