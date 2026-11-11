import {NextResponse} from 'next/server';
import {maintenanceMode} from '../_lib/maintenance';
export function GET(){const mode=maintenanceMode();return NextResponse.json({mode,apiWrites:mode==='OPEN'?'normal':mode==='RECOVERY'?'estimate-create-update-only':'blocked',databaseFence:'operator-verification-required'},{headers:{'Cache-Control':'no-store'}});}
