export interface Finding {
  /** The check's name (first-frame, file-name, external-url, absolute-path, nondeterminism, orientation, picture-missing, stand-ratio, picture-contrast, pictures-none, ...). */
  rule: string;
  /** Relative to the work's folder. */
  file: string;
  /** 0 when the finding is about the whole file or work. */
  line: number;
  message: string;
}
export const ALLOWABLE: string[];
export function checkWork(dir: string, options?: { allow?: string[] }): { errors: Finding[]; warnings: Finding[] };
export function format(f: Finding): string;
