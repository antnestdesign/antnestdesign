import {ApiError} from '../../_lib/server';
import {LEGACY_EDITOR_STATE} from '../../../../../public/os-app/src/legacy-editor-state.js';

export function rejectLegacyEditorWrite() {
  if(LEGACY_EDITOR_STATE.retired)throw new ApiError(410,LEGACY_EDITOR_STATE.message);
}
