import {NextRequest} from 'next/server';
import {projectWorkflow} from '../../_lib/project-workflow';
type Route={params:Promise<{id:string}>};
export async function GET(request:NextRequest,route:Route){return projectWorkflow(request,(await route.params).id);}
export async function POST(request:NextRequest,route:Route){return projectWorkflow(request,(await route.params).id);}
