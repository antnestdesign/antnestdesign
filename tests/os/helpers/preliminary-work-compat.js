import { PRELIMINARY_WORK_INPUT_SCHEMA } from "../../../public/os-app/src/estimate-inputs.js";

// Golden fixtures predate these nine opt-in inputs. Keep every old field exact.
export const legacyWorkFields = value => Object.fromEntries(Object.entries(value).filter(([id]) => !Object.hasOwn(PRELIMINARY_WORK_INPUT_SCHEMA, id)));
