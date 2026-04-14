import { ESSAY_MODE } from "./essay";
import { EMAIL_MODE } from "./email";
import { BLOG_MODE } from "./blog";
import { COVER_LETTER_MODE } from "./cover-letter";
import { FREE_FORM_MODE } from "./free-form";
import type { Mode } from "../../store";

export type ModeConfig = {
  name: string;
  displayName: string;
  seedQuestion: string;
  targetWords: number;
  systemAddition: string;
  rubricItems: string[];
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
