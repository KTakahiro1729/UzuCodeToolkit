import { SeededRandomImpl } from '@uzuhq/code-sdk';
import { describe, expect, it } from 'vitest';
import { deal, deck, JOKER, rankOf, suitOf } from '../src';

describe('deck', () => {
  it('holds 52 different cards, plus the jokers asked for', () => {
    expect(new Set(deck())).toHaveProperty('size', 52);
    expect(deck(2).filter((c) => c === JOKER)).toHaveLength(2);
    expect(rankOf('TH')).toBe('T');
    expect(suitOf('TH')).toBe('H');
    expect(rankOf(JOKER)).toBeNull();
  });

  it('shuffles the same way from the same seed', () => {
    const shuffle = () => SeededRandomImpl.fromState(7).shuffle(deck());
    expect(shuffle()).toEqual(shuffle());
    expect(shuffle()).not.toEqual(deck());
  });
});

describe('deal', () => {
  it('deals round the seats from the top and takes the cards out', () => {
    const cards = deck();
    const hands = deal(cards, ['a', 'b'], 2);
    expect(hands).toEqual({ a: ['AS', '3S'], b: ['2S', '4S'] });
    expect(cards).toHaveLength(48);
    expect(cards[0]).toBe('5S');
  });

  it('deals every card when no count is given', () => {
    const hands = deal(deck(), ['a', 'b', 'c']);
    expect([hands.a.length, hands.b.length, hands.c.length]).toEqual([18, 17, 17]);
  });

  it('throws when there are too few cards', () => {
    expect(() => deal(deck().slice(0, 3), ['a', 'b'], 2)).toThrow();
  });
});
