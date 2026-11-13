/**
 * Playing cards: the 52-card deck (plus jokers if asked) and dealing. Cards are short strings, so
 * hands and decks sit in the state as plain arrays. Shuffle on the server with the SDK's random,
 * in a serverAction: `random.shuffle(deck())`.
 */

export const SUITS = ['S', 'H', 'D', 'C'] as const;
/** Ace low to king; T is ten. Games rank them their own way. */
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];
export const JOKER = 'joker';
/** Rank then suit, such as `TH` (ten of hearts), or the joker. */
export type Card = `${Rank}${Suit}` | typeof JOKER;

/** A new deck in a fixed order: every suit from ace to king, then `jokers` jokers. */
export function deck(jokers = 0): Card[] {
  const cards: Card[] = SUITS.flatMap((s) => RANKS.map((r): Card => `${r}${s}`));
  for (let i = 0; i < jokers; i++) cards.push(JOKER);
  return cards;
}

export const rankOf = (card: Card): Rank | null => (card === JOKER ? null : (card[0] as Rank));
export const suitOf = (card: Card): Suit | null => (card === JOKER ? null : (card[1] as Suit));

/**
 * Deal from the top of `cards` (its start) one at a time around `seats`, `count` each, or until
 * the cards run out when `count` is left out (earlier seats may get one more). Takes the dealt
 * cards out of `cards`. Throws if there are too few.
 */
export function deal(cards: Card[], seats: readonly string[], count?: number): Record<string, Card[]> {
  const total = count === undefined ? cards.length : count * seats.length;
  if (total > cards.length) throw new Error(`cannot deal ${total} cards from ${cards.length}`);
  const hands: Record<string, Card[]> = Object.fromEntries(seats.map((s) => [s, []]));
  cards.splice(0, total).forEach((card, i) => hands[seats[i % seats.length]].push(card));
  return hands;
}
