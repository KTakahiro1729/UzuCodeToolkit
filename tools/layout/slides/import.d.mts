export type Rect = number[];
export interface ImportLayout {
  reference: Partial<Record<'landscape' | 'portrait', readonly [number, number]>>;
  parts: Record<string, { landscape?: Rect; portrait?: Rect; [k: string]: unknown }>;
  reserved?: Record<string, unknown>;
  scenes: { id: number; key: string; show: string[]; mine: string[] }[];
  [k: string]: unknown;
}
export type Align = 'left' | 'center' | 'right';
export interface SlideShape { text: string; id?: string; align: Align; x: number; y: number; w: number; h: number }
export interface ImportResult {
  layout: ImportLayout;
  moved: { id: string; orientation: string; from: Rect; to: Rect }[];
  aligned: { id: string; from: Align; to: Align }[];
  added: { orientation: string; scene: string; slide: number; text: string; rect: Rect; copyOf?: string }[];
  removed: { orientation: string; scene: string; slide: number; id: string }[];
  conflicts: ({ id: string; orientation: string; places: { scene: string; slide: number; rect: Rect }[] } | { id: string; align: true; places: { scene: string; slide: number; align: Align }[] })[];
  problems: string[];
}
export function readSlides(buffer: Uint8Array): Promise<{ width: number; height: number; slides: { shapes: SlideShape[] }[] }>;
export function importSlides(layout: ImportLayout, buffer: Uint8Array): Promise<ImportResult>;
export function applyMoves(text: string, moved: ImportResult['moved'], updated: ImportLayout, aligned?: ImportResult['aligned']): string;
export function reportOf(result: ImportResult): string;
