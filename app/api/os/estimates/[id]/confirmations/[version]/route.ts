import {NextRequest} from 'next/server';
import {confirmationGet} from '../../../_lib/confirmation';
export async function GET(request:NextRequest,route:{params:Promise<{id:string;version:string}>}){
  const p=await route.params;return confirmationGet(request,p.id,p.version);
}
