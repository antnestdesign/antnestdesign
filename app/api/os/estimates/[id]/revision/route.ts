import {NextRequest} from 'next/server';
import {confirmationPost} from '../../_lib/confirmation';
export async function POST(request:NextRequest,route:{params:Promise<{id:string}>}){return confirmationPost(request,(await route.params).id,'revise');}
