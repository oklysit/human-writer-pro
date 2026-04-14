import { getBasePrompt } from "./base";
import { getMode } from "./modes";
import { getInterviewSystemPrompt } from "./steps/interview";
import type { Mode } from "../store";

export function composeInterviewPrompt(mode: Mode, turnCount: number): string {
  const modeConfig = getMode(mode);
  return `${getBasePrompt()}\n\n---\n\n${getInterviewSystemPrompt(modeConfig, turnCount)}`;
}
