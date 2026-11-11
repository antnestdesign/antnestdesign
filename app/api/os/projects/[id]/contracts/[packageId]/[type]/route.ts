import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {ApiError,getUserContext,json,supabaseFetch} from '../../../../../_lib/server';
import {assertUuid,DOCUMENT_TYPES} from '../../../../../contract-packages/_lib/contracts';
import {confirmedContractAccess,Row} from '../../../../../contract-packages/_lib/confirmed-source';
type Params={params:Promise<{id:string;packageId:string;type:string}>};
export async function GET(request:NextRequest,{params}:Params){
 try{
  const {id,packageId,type}=await params;await confirmedContractAccess(await getUserContext(request),id);assertUuid(packageId,'계약 버전');
  if(!DOCUMENT_TYPES.some(t=>t===type))throw new ApiError(404,'문서 종류를 찾을 수 없습니다.');
  const pack=(await supabaseFetch<Row[]>(`/rest/v1/contract_package_snapshots?id=eq.${packageId}&preliminary_project_id=eq.${id}&select=id,contract_no,package_version&limit=1`))[0];
  if(!pack)throw new ApiError(404,'이 프로젝트의 발행 문서가 아닙니다.');
  const doc=(await supabaseFetch<Row[]>(`/rest/v1/contract_document_versions?package_id=eq.${packageId}&document_type=eq.${type}&select=pdf_bytes,pdf_sha256&limit=1`))[0];
  if(!doc?.pdf_bytes)throw new ApiError(404,'저장된 PDF가 없습니다.');
  const bytes=Buffer.from(String(doc.pdf_bytes).replace(/^\\x/,''),'hex');if(createHash('sha256').update(bytes).digest('hex')!==doc.pdf_sha256)throw new ApiError(500,'PDF 무결성 확인에 실패했습니다.');
  return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${pack.contract_no}-V${pack.package_version}-${type}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){return json({error:error instanceof ApiError?error.message:'PDF를 조회하지 못했습니다.'},{status:error instanceof ApiError?error.status:500});}
}
