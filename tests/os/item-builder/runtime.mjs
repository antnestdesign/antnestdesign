import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export const artifactRoot=pathToFileURL(resolve(process.env.AND_OS_ITEM_TEST_OUTPUT||resolve(tmpdir(),'and-os-item-builder-checks'))+'/');
