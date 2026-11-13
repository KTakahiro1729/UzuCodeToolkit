export const DEFAULT_LAYOUT: string;
export interface BriefLayout {
  screen: string;
  reference: Partial<Record<'landscape' | 'portrait', readonly [number, number]>>;
  parts: Record<string, { label: string; image?: string; stretch?: boolean; landscape?: readonly number[]; portrait?: readonly number[] }>;
  reserved?: Record<string, { label: string; landscape?: readonly number[]; portrait?: readonly number[] }>;
  margin?: Partial<Record<'landscape' | 'portrait', { top: number; right: number; bottom: number; left: number }>>;
  scenes: { id: number; key: string; label: string; show: string[]; mine: string[] }[];
}
export interface ImageEntry {
  image: string;
  file: string;
  role: boolean;
  width: number;
  height: number;
  stretch: boolean;
  opaque: boolean;
  boxes: { id: string; label: string; stretch: boolean; box: readonly number[] }[];
}
export function pickOrientation(layout: BriefLayout, asked?: string): 'landscape' | 'portrait';
export function imageList(layout: BriefLayout, orientation: 'landscape' | 'portrait'): ImageEntry[];
export function buildBrief(layout: BriefLayout, options?: { world?: string; orientation?: string }): string;
