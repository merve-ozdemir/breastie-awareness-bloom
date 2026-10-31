import { describe, it, expect } from 'vitest';
import { matchExam } from './exam';
const zones = (t: string, l = 'en') => matchExam(t, l).entries.filter(e => e.mentioned).map(e => `${e.breast}:${e.zone}`);
describe('relative left/right side of a breast', () => {
  it('upper left of the left breast is upper outer', () => expect(zones('My left breast, upper left side, has a lump.')).toEqual(['left:upper_outer']));
  it('upper left of the right breast is upper inner', () => expect(zones('My right breast, upper left side, has a lump.')).toEqual(['right:upper_inner']));
  it('lower right of the left breast is lower inner', () => expect(zones('Left breast lower right part is red.')).toEqual(['left:lower_inner']));
  it('lower right of the right breast is lower outer', () => expect(zones('Right breast lower right part is red.')).toEqual(['right:lower_outer']));
  it('works in German', () => expect(zones('Linke Brust oben rechts ist ein Knoten.', 'de')).toEqual(['left:upper_inner']));
  it('still understands inner/outer', () => expect(zones('Left breast upper outer has a lump.')).toEqual(['left:upper_outer']));
  it('keeps unrelated sentences as notes', () => expect(matchExam('Left breast upper outer has a lump. I went running yesterday.', 'en').general_note).toBe('I went running yesterday.'));
});
