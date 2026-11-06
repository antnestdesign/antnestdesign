import {artifactRoot} from './runtime.mjs';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {renderDetailedVersion} from '../../../public/os-app/src/detailed-version-print.js';
const require=createRequire(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/test.cjs')),browser=await require('playwright').chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
const APP='http://127.0.0.1:3111',out=artifactRoot,data=JSON.parse(readFileSync(new URL('detailed-result.json',out),'utf8'));
await page.route('**/*',r=>new URL(r.request().url()).origin===APP?r.continue():r.abort());
try{for(const [label,doc]of[['v1',data.v1],['v2',data.v2]]){await page.setContent(`<html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${APP}/os-app/styles.css"><link rel="stylesheet" href="${APP}/os-app/document-print.css"></head><body><main id="printQuoteSheet" class="detailed-issued-print-sheet">${renderDetailedVersion(doc)}</main></body></html>`);await page.waitForLoadState('networkidle');await page.pdf({path:new URL(`issued-${label}.pdf`,out).pathname.replace(/^\//,''),format:'A4',preferCSSPageSize:true,printBackground:true});}console.log('CUSTOM_ITEM_V1_V2_PDF_RENDERED');}finally{await browser.close();}
