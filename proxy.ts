import {NextRequest,NextResponse} from 'next/server';
import {maintenanceAllows,maintenanceMode} from './app/api/os/_lib/maintenance';
export function proxy(request:NextRequest){
 const mode=maintenanceMode(),path=request.nextUrl.pathname;
 if(path.startsWith('/api/os/detailed-estimates')&&!['GET','HEAD','OPTIONS'].includes(request.method))return NextResponse.json({error:'구형 본견적 작성 기능은 종료되었습니다.'},{status:410,headers:{'Cache-Control':'no-store'}});
 if(path.startsWith('/api/os/')&&!maintenanceAllows(request.method,path,mode))return NextResponse.json({error:'시스템 점검 중입니다. 저장하지 말고 잠시 후 다시 확인해 주세요.',code:'OS_MAINTENANCE'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});
 if(mode==='PAUSED'&&!path.startsWith('/api/'))return new NextResponse('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AND OS 점검</title><body><h1>AND OS 점검 중</h1><p>기존 작업을 보존하고 있습니다. 점검 종료 후 다시 접속해 주세요.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Retry-After':'60'}});
 return NextResponse.next();
}
export const config={matcher:['/api/os/:path*','/os','/os-app/:path*']};
