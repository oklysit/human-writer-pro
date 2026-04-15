import { ESSAY_MODE } from "./essay";
import { EMAIL_MODE } from "./email";
import { BLOG_MODE } from "./blog";
import { COVER_LETTER_MODE } from "./cover-letter";
import { FREE_FORM_MODE } from "./free-form";
import type { Mode } from "../../store";

export type ModeConfig = {
  name: string;
  displayName: string;
  /**
   * Mode-specific guidance for the interviewer (what a good {displayName}
   * needs in terms of raw material). Read only by the interview stage —
   * never enters the assembly call. Per 2026-04-15 adaptive-interviewer
   * refactor, rubricItems / seedQuestion / targetWords are dropped;
   * the model reasons about question count + structure from this guidance
   * + user-provided context.
   */
  systemAddition: string;
};

export const MODES: Record<Mode, ModeConfig> = {
  essay: ESSAY_MODE,
  email: EMAIL_MODE,
  blog: BLOG_MODE,
  "cover-letter": COVER_LETTER_MODE,
  "free-form": FREE_FORM_MODE,
};

export function getMode(mode: Mode): ModeConfig {
  return MODES[mode];
}
