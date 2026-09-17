export * from './types';
export * from './content';
export * from './pace';
import { HYBRIDS, ARTS, UPT } from './content';
import type { Hybrid, Artifact, Upgrade } from './types';

export const HYB: Record<string, Hybrid> = Object.fromEntries(HYBRIDS.map(h => [h.id, h]));
export const ART: Record<string, Artifact> = Object.fromEntries(ARTS.map(a => [a.id, a]));
export const UPI: Record<string, Upgrade> = Object.fromEntries(UPT.flatMap(t => t.items).map(u => [u.id, u]));

/** Shop items. Prices are functions of state, so they live in sim/actions; this is the catalogue. */
export interface ShopItem { id: string; n: string; e: string; d: string }
export const SHOP: ShopItem[] = [
  { id: 'crate', n: 'Sample crate', e: '📦', d: 'Three samples of common strains you have already found. Doc Ferro keeps a fridge. Price climbs each time today.' },
  { id: 'boost', n: 'Heat lamp', e: '🔥', d: '2× growth and income for {boost}.' },
  { id: 'icepack', n: 'Ice pack', e: '🧊', d: 'The dish keeps working two hours longer while you are away. Once.' },
  { id: 'ticket', n: 'Extra ticket', e: '🎟️', d: 'One more go at the pipette today. Price climbs each time.' },
  { id: 'pebble', n: 'Mystery pebble', e: '🪨', d: 'A random common artifact for the enclosure.' },
];

/** Real-money products (ROADMAP §30). Prices are display strings; the store sets the real ones. The purchase
 * flow is a stand-in until the native build; effects are real so playtests can judge them. All non-consumable. */
export interface IapProduct { id: string; n: string; price: string; e: string; d: string }
export const IAP: IapProduct[] = [
  { id: 'noads', n: 'No more ads', price: '$2.99', e: '🚫', d: 'Every rewarded bonus is yours without watching the video. The cooldown between them stays.' },
  { id: 'starter', n: 'Starter kit', price: '$0.99', e: '🎁', d: '500 biomass, 20 Notes and 3 tickets, once.' },
  { id: 'bigshelf', n: 'Deep shelf', price: '$1.99', e: '🗄️', d: 'The shelf holds 5 more of every strain, forever.' },
  { id: 'supporter', n: "Supporter's heart", price: '$1.99', e: '❤️', d: 'A heart on the sign and our thanks. Nothing else, on purpose.' },
];
export const IAP_BY: Record<string, IapProduct> = Object.fromEntries(IAP.map(p => [p.id, p]));

/** how many of a strain the specimen study perks give, by rarity: [kind, amount][] */
export const STUDY_PERKS: [string, number][][] = [
  [['income', 0.03]], [['cycle', 0.03]], [['lv', 1]], [['income', 0.10], ['cycle', 0.05]], [['drop', 1]], [['lv', 2], ['income', 0.10]],
];
export const STUDY_DANGER_PERK: [string, number][] = [['guard', 0.05]];

/** pipette grades: rarity weights for miss / close / nice / perfect */
export const PIPETTE_W = [[85, 15, 0, 0], [55, 35, 9, 1], [25, 45, 25, 5], [5, 25, 45, 25]];
export const EMOTES = ['♥', '♪', '!', '?', '☺'];

/** Lab equipment: ranked with Notes (and a little biomass). Persists across scale-ups; Genesis resets it. */
export interface Equipment { id: string; n: string; d: string; max: number; notes: number; grow: number; bio: number }
export const EQUIP: Equipment[] = [
  { id: 'dish',    n: 'Petri dish',  d: '+1 effective level per rank',                              max: 30, notes: 3,  grow: 1.25, bio: 10 },
  { id: 'scope',   n: 'Microscope',  d: '+2% chance a duplicate turns out to be a strain you have not found', max: 15, notes: 8,  grow: 1.28,  bio: 20 },
  { id: 'incub',   n: 'Incubator',   d: '−2% cycle time per rank',                                  max: 15, notes: 8,  grow: 1.28,  bio: 20 },
  { id: 'pipette', n: 'Pipette',     d: '+1 colony per cycle every three ranks',                    max: 12, notes: 12, grow: 1.3, bio: 30 },
  { id: 'clean',   n: 'Clean room',  d: '+4% quarantine on arrival and +1 spare on the shelf, per rank', max: 10, notes: 10, grow: 1.3, bio: 25 },
];
export const EQ: Record<string, Equipment> = Object.fromEntries(EQUIP.map(e => [e.id, e]));

/** Field trips: send an expedition, it comes back with Notes and sometimes a live sample. Times are mockup seconds. */
export interface Site { id: string; n: string; d: string; time: number; notes: [number, number]; sample: number; sampleR: number; unlock: [number, number] }
export const SITES: Site[] = [
  { id: 'pond',   n: 'The pond',      d: 'Ten minutes along the towpath. Damp, and something is always growing.', time: 60,   notes: [4, 6],     sample: .12, sampleR: 0, unlock: [0, 1] },
  { id: 'bakery', n: "Ida's bakery",  d: 'Warm, floury, and the yeast talks. Ida sends buns back with you.',      time: 180,  notes: [15, 21],   sample: .2,  sampleR: 1, unlock: [0, 3] },
  { id: 'woods',  n: 'The woods',     d: 'Past the pond and up the hill. Things live under the bark.',           time: 600,  notes: [68, 82],   sample: .3,  sampleR: 2, unlock: [0, 6] },
  { id: 'quarry', n: 'The old quarry', d: 'Flooded, cold, and strange. Nobody goes. You go.',                    time: 1800, notes: [280, 320], sample: .35, sampleR: 3, unlock: [1, 0] },
];
export const SITE: Record<string, Site> = Object.fromEntries(SITES.map(x => [x.id, x]));
