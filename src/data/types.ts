// Shapes of the game's data. The values live in content.ts and index.ts.

export interface Look {
  shape: string; col: string; col2?: string; eyes?: number;
  fuzz?: number; tail?: number; teeth?: number; glow?: number; halo?: number; spots?: number; sparkle?: number;
}
export interface Strain { n: string; d: string; look: Look; danger: number }
export interface TierDef { n: string; items: Strain[][] }
export interface Rarity { n: string; col: string; [k: string]: unknown }

/** one requirement on a request: a strain, any spare, a rarity or better, or a brewed medicine, times n */
export type Req =
  | { t: 'strain'; r: number; i: number; n: number }
  | { t: 'any'; n: number }
  | { t: 'rarity'; r: number; n: number }
  | { t: 'med'; id: string; n: number };

export interface StoryStep {
  who: string; face: string; say: string; reward: number; after: string;
  tonic?: string; need?: [number, number, number][]; req?: Req[]; gives?: string;
  outbreak?: boolean; hp?: number; time?: number; boss?: [number, number, number];
}
export interface Chapter { title: string; intro: string; steps: StoryStep[] }

export interface SideQuest {
  who: string; face: string; say: string; stat: string; n: number; reward: number; verb: string; unit: string;
  gate?: { lv?: number; undiscovered?: number; area?: string };
}
export interface Hybrid { id: string; n: string; d: string; par: [number, number][]; look: Look; perk: string; pd: string }
export interface Artifact { id: string; n: string; e: string; r: number; perk: [string, number]; d: string }
export interface Upgrade { id: string; n: string; d: string; k: string; v: number; cost: number; req?: string }
export interface UpTier { n: string; need: number; items: Upgrade[] }
export interface Research { id: string; cost: number; time: number; req: string | null; max?: number; step?: number; gate?: string; tier?: number; fx?: [string, number] }
export interface GenPerk { id: string; n: string; d: string; max: number }
export interface Medicine { id: string; n: string; need: [number, number, number][]; time: number }
