// Plays both seats through the whole read-through in the dev harness and checks for prediction warnings.
import { it } from 'vitest';
import { allPhases, readThrough } from '../../../tools/e2e/all-phases.mjs';
import script from '../script/script.json';

it('plays every seat through every phase with no prediction warnings', { timeout: 180_000 }, () =>
  allPhases({ phases: [{ id: 'reading' }], drive: { reading: readThrough(script) } }),
);
