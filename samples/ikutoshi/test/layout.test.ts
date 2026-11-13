import { existsSync } from 'node:fs';
import { layoutProblems, type ScreenLayout } from '@uzu-toolkit/reader/stage';
import { expect, it } from 'vitest';
import definition from '../read-through.layout.json';

it('uses a valid landscape layout with all the named stage art', () => {
  const layout = definition as unknown as ScreenLayout;
  expect(layoutProblems(layout)).toEqual([]);
  const mine = new Set(layout.scenes.flatMap((scene) => scene.mine));
  for (const [id, part] of Object.entries(layout.parts)) {
    if (!part.image) continue;
    const variants = part.image.includes('{role}')
      ? ['yae', 'reiji'].map((role) => part.image!.replace('{role}', role))
      : mine.has(id) ? [part.image, part.image + '-mine'] : [part.image];
    for (const image of variants) {
      expect(existsSync(new URL(`../public/assets/${image}.webp`, import.meta.url)), image).toBe(true);
    }
  }
});
