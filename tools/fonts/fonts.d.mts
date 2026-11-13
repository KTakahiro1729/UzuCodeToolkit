export const FONT_FILES: { story: string[]; ui: string[] };
export function collectGlyphs(projectDir: string): { story: string; ui: string; ignore: string; out: string };
export function fontCodePoints(file: string): Set<number>;
export function missingGlyphs(projectDir: string): { story: string[]; ui: string[] };
