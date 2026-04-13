import { getBasePrompt } from "./base";
import { getMode, type ModeConfig } from "./modes";
import { getInterviewSystemPrompt } from "./steps/interview";
import { getAssemblySystemPrompt } from "./steps/assembly";
import { getEditSystemPrompt } from "./steps/edit";
import type { Mode } from "../store";

export function composeInterviewPrompt(mode: Mode, turnCount: number): string {
  const modeConfig = getMode(mode);
  return `${getBasePrompt()}\n\n---\n\n${getInterviewSystemPrompt(modeConfig, turnCount)}`;
}

export function composeAssemblyPrompt(mode: Mode, rawInterview: string): string {
  const modeConfig = getMode(mode);
  return `${getBasePrompt()}\n\n---\n\n${getAssemblySystemPrompt(modeConfig, rawInterview)}`;
}

export function composeEditPrompt(mode: Mode, rawInterview: string, currentOutput: string): string {
  const modeConfig = getMode(mode);
  return `${getBasePrompt()}\n\n---\n\n${getEditSystemPrompt(modeConfig, rawInterview, currentOutput)}`;
}
