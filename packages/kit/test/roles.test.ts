import { describe, expect, it } from 'vitest';
import { assignRoles, seatOfRole } from '../src/roles';

describe('assignRoles', () => {
  it('選ばれたキャラを優先し、 残りを席順に割り当てる', () => {
    const roles = assignRoles(
      [{ id: 's1' }, { id: 's2', characterId: 'alice' }, { id: 's3', characterId: 'alice' }],
      ['alice', 'bob', 'carol'],
    );
    expect(roles).toEqual({ s2: 'alice', s1: 'bob', s3: 'carol' });
    expect(seatOfRole(roles, 'carol')).toBe('s3');
    expect(seatOfRole(roles, 'dave')).toBeNull();
  });
  it('役より席が多ければ投げる', () => {
    expect(() => assignRoles([{ id: 'a' }, { id: 'b' }], ['x'])).toThrow();
  });
});
