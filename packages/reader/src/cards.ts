/**
 * Playing-card parts, an entry of their own (`@uzu-toolkit/reader/cards`): the deck's images are
 * emitted with whatever imports this module, so a work without cards does not import it and
 * ships none of them.
 */

export { default as PlayingCard } from './components/PlayingCard.svelte';
