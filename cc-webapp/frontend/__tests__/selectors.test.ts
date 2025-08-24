// @ts-nocheck
import { selectGold } from '../hooks/useSelectors';

describe('selectGold', () => {
  it('returns 0 when state is undefined', () => {
    expect(selectGold(undefined as any)).toBe(0);
  });

  it('returns 0 when profile is missing', () => {
    expect(selectGold({} as any)).toBe(0);
  });

  it('returns profile.gold when present', () => {
    expect(selectGold({ profile: { gold: 1234 } } as any)).toBe(1234);
  });
});
