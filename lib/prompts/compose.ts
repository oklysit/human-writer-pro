import { getBasePrompt } from "./base";
import { getMode } from "./modes";
import { getInterviewSystemPrompt } from "./steps/interview";
import { getAssemblySystemPrompt } from "./steps/assembly";
import type { Mode } from "../store";

export function composeInterviewPrompt(mode: Mode, turnCount: number): string {
  const modeConfig = getMode(mode);
  return `${getBasePrompt()}\n\n---\n\n${getInterviewSystemPrompt(modeConfig, turnCount)}`;
}

export function composeAssemblyPrompt(mode: Mode, rawInterview: string): string {
  const modeConfig = getMode(mode);
  return `${getBasePrompt()}\n\n---\n\n${getAssemblySystemPrompt(modeConfig, rawInterview)}`;
}
