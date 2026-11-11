import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium as playwright} from 'playwright-core';
import chromium from '@sparticuz/chromium';
import {createContractPrint} from '../../../../../public/os-app/src/contract-print.js';
import {DOCUMENT_TYPES,ContractDocumentType} from './contracts';

let css:string;
// Buffered Vercel responses are limited to 4.5 MB; reject before issuing an unretrievable document.
export const MAX_CONTRACT_PDF_BYTES=4_000_000;
export function assertContractPdf(pdf:Buffer){
 if(pdf.length<1000||pdf.length>MAX_CONTRACT_PDF_BYTES||pdf.subarray(0,5).toString()!=='%PDF-')throw new Error('PDF validation failed');
}
function printCss(){
 if(css)return css;
 const root=process.cwd(),fontDir=join(root,'node_modules/@fontsource/noto-sans-kr');
 const fonts=readFileSync(join(fontDir,'400.css'),'utf8').replace(/src:\s*url\(([^)]+\.woff2)\)[^;]+;/g,(_all,path:string)=>`src:url(data:font/woff2;base64,${readFileSync(join(fontDir,path)).toString('base64')}) format('woff2');`);
 css=readFileSync(join(root,'public/os-app/styles.css'),'utf8')+'\n'+fonts+'\nhtml,body,#printQuoteSheet,.contract-print-page{font-family:"Noto Sans KR",sans-serif!important;letter-spacing:0}body{margin:0;background:white}#printQuoteSheet{display:block!important;max-width:190mm;margin:0 auto;padding:0}.contract-print-page{font-size:10.5pt;line-height:1.55}.contract-print-header{display:flex;justify-content:space-between;gap:10mm}.contract-print-table{width:100%;border-collapse:collapse;table-layout:fixed}.contract-print-table th,.contract-print-table td{border:1px solid #ccc;padding:2mm;overflow-wrap:anywhere}.contract-print-section{margin:4mm 0}.contract-print-grid{display:grid;grid-template-columns:1fr 1fr}.contract-print-signature{display:flex;justify-content:space-between}.contract-print-footer{display:flex;flex-wrap:wrap;gap:3mm;margin-top:5mm;font-size:9pt}h1{font-size:22pt}h2{font-size:12pt}.contract-print-header dl{font-size:9pt}@page{size:A4;margin:12mm}@media print{thead{display:table-header-group}tr{break-inside:avoid}.contract-print-footer{break-before:avoid}}';
 css+='\n.contract-print-table th,.contract-print-table td{white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}.contract-print-footer::after{content:none!important}';
 css+='\n@media print{.contract-print-section:has(.document-quote-table),.contract-print-section:has(.contract-spec-print-table){break-inside:auto;page-break-inside:auto}.document-signature-intro,.contract-print-signature{break-after:avoid;page-break-after:avoid}.contract-print-footer{break-inside:avoid;page-break-inside:avoid}}';
 return css;
}
export function contractHtml(type:ContractDocumentType,snapshot:Record<string,unknown>,documents:Array<Record<string,unknown>>,stamp:string){
 const print=createContractPrint({document:null,formatDateTime:()=>new Date(stamp).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})});
 const parts={CONTRACT:()=>print.renderContractPrintDocument(snapshot,documents),QUOTE:()=>print.renderContractQuotePrint(snapshot),SPEC:()=>print.renderContractSpecPrint(snapshot)};
 // The quotation attachment must display its own frozen amount even after an approved contract adjustment.
 const quote= snapshot.estimate_snapshot as Record<string,unknown>;
 if(type==='QUOTE')snapshot={...snapshot,contract_info:{...(snapshot.contract_info as object),total_amount:quote.total_price,supply_amount:(snapshot.contract_info as Record<string,unknown>).quote_supply_amount,vat_amount:(snapshot.contract_info as Record<string,unknown>).quote_vat_amount}};
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>계약 문서</title><style>${printCss()}</style></head><body><section id="printQuoteSheet">${parts[type]()}</section></body></html>`;
}
export async function contractPdfs(html:Record<ContractDocumentType,string>){
 const windows=process.platform==='win32';
 const local=process.env.AND_OS_PDF_CHROMIUM_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
 const env=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined&&!/SUPABASE|DATABASE|^PG|^VERCEL|^AWS|TOKEN|SECRET|PASSWORD|^NEXT_PUBLIC/.test(entry[0])));
 const browser=await playwright.launch(windows?{executablePath:local,headless:true,env}:{executablePath:await chromium.executablePath(),args:chromium.args,headless:true,env});
 try{
  const page=await browser.newPage();await page.route('**/*',r=>r.abort());const result=[];
  for(const type of DOCUMENT_TYPES){await page.setContent(html[type],{waitUntil:'load',timeout:20000});await page.evaluate(()=>document.fonts.ready);const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;text-align:right;width:100%;padding-right:12mm"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'});assertContractPdf(pdf);result.push({document_type:type,pdf_bytes:'\\x'+pdf.toString('hex'),pdf_sha256:createHash('sha256').update(pdf).digest('hex')});}
  return result;
 }finally{await browser.close();}
}
