export * from './types';
export * from './generated';
import { HYBRIDS, ARTS, UPT } from './generated';
import type { Hybrid, Artifact, Upgrade } from './types';

export const HYB: Record<string, Hybrid> = Object.fromEntries(HYBRIDS.map(h => [h.id, h]));
export const ART: Record<string, Artifact> = Object.fromEntries(ARTS.map(a => [a.id, a]));
export const UPI: Record<string, Upgrade> = Object.fromEntries(UPT.flatMap(t => t.items).map(u => [u.id, u]));

/** Shop items. Prices are functions of state, so they live in sim/actions; this is the catalogue. */
export interface ShopItem { id: string; n: string; e: string; d: string }
export const SHOP: ShopItem[] = [
  { id: 'crate', n: 'Sample crate', e: '📦', d: 'Three spare samples of common strains you have already found. Doc Ferro keeps a fridge. Price climbs each time today.' },
  { id: 'boost', n: 'Heat lamp', e: '🔥', d: '2× growth and income for two minutes.' },
  { id: 'icepack', n: 'Ice pack', e: '🧊', d: 'The dish keeps working two hours longer while you are away. Once.' },
  { id: 'ticket', n: 'Extra ticket', e: '🎟️', d: 'One more go at the pipette today. Price climbs each time.' },
  { id: 'pebble', n: 'Mystery pebble', e: '🪨', d: 'A random common artifact for the enclosure.' },
];

/** how many of a strain the specimen study perks give, by rarity: [kind, amount][] */
export const STUDY_PERKS: [string, number][][] = [
  [['income', 0.03]], [['cycle', 0.03]], [['lv', 1]], [['income', 0.10], ['cycle', 0.05]], [['drop', 1]], [['lv', 2], ['income', 0.10]],
];
export const STUDY_DANGER_PERK: [string, number][] = [['guard', 0.05]];

/** pipette grades: rarity weights for miss / close / nice / perfect */
export const PIPETTE_W = [[85, 15, 0, 0], [55, 35, 9, 1], [25, 45, 25, 5], [5, 25, 45, 25]];
export const EMOTES = ['♥', '♪', '!', '?', '☺'];
