import { ApiError } from "../../_lib/server";

export type FoundationMode = "OFF" | "READ_ONLY" | "ON";
export const FOUNDATION_READ_ACTIONS = new Set(["projects", "customers", "project", "preview", "get", "events"]);

export function foundationMode(): FoundationMode {
  const value = process.env.AND_OS_PROJECT_FOUNDATION_MODE;
  return value === "ON" || value === "READ_ONLY" ? value : "OFF";
}

export class FoundationModeError extends ApiError {
  constructor(public mode: FoundationMode) {
    super(mode === "READ_ONLY" ? 423 : 503, mode === "READ_ONLY"
      ? "프로젝트·본견적 기능은 현재 읽기 전용입니다."
      : "프로젝트·본견적 기능은 현재 비활성화되어 있습니다.");
  }
}

export function requireFoundationAction(action: string): FoundationMode {
  const mode = foundationMode();
  if (mode === "OFF" || (mode === "READ_ONLY" && !FOUNDATION_READ_ACTIONS.has(action))) throw new FoundationModeError(mode);
  return mode;
}
