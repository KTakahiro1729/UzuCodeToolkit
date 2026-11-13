// The work's own source passes the toolkit's static checks (certification and prediction pitfalls).
import { expect, it } from 'vitest';
import { checkWork, format } from '../../../tools/check/static.mjs';

it('has no static defect', () => {
  expect(checkWork(new URL('..', import.meta.url).pathname).errors.map(format)).toEqual([]);
});
