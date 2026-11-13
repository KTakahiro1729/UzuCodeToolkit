import type pptxgen from 'pptxgenjs';
import type { Orientation, ScreenLayout } from '../../../packages/reader/src/layout.ts';

export const DEFAULT_LAYOUT: string;
export const PX_PER_INCH: number;
export function boxText(label: string, id: string, w: number, h: number): string;
export function orientationsOf(layout: ScreenLayout): Orientation[];
export function buildDeck(layout: ScreenLayout, orientation: Orientation): pptxgen;
export function exportLayout(layout: ScreenLayout, outDir: string): Promise<string[]>;
