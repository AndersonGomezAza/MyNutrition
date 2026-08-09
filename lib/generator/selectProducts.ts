import type { FoodGroup } from "@/lib/scraper/categorize";
import {
  BUDGET_SHARES,
  DEFAULT_EXCLUDED_CATEGORIES,
  MAX_ITEMS_PER_SIMPLE_GROUP,
  MAX_PROTEIN_ITEMS,
  PROTEIN_SUBTYPES,
  SIMPLE_FOOD_GROUPS,
} from "./config";

export type Candidate = {
  id: string;
  name: string;
  price_cop: number;
  category: string;
  food_group: FoodGroup;
};

export type SelectedItem = {
  productId: string;
  name: string;
  price_cop: number;
  food_group: FoodGroup;
  qty: number;
};

const PROTEIN_LABELS: Record<string, string> = {
  protein_red_meat: "carne de res o cerdo",
  protein_poultry: "pollo",
  protein_fish: "pescado",
  protein_egg: "huevo",
  protein_legume: "legumbres",
};

export function buildCandidatePool(
  products: Candidate[],
  excludedTerms: string[]
): Candidate[] {
  const excludedCategories = new Set(DEFAULT_EXCLUDED_CATEGORIES);
  const terms = excludedTerms.map((t) => t.trim().toLowerCase()).filter(Boolean);

  return products.filter((p) => {
    if (excludedCategories.has(p.category)) return false;
    const lowerName = p.name.toLowerCase();
    if (terms.some((t) => lowerName.includes(t))) return false;
    return true;
  });
}

export function groupByFoodGroup(pool: Candidate[]): Map<FoodGroup, Candidate[]> {
  const map = new Map<FoodGroup, Candidate[]>();
  for (const p of pool) {
    const list = map.get(p.food_group) ?? [];
    list.push(p);
    map.set(p.food_group, list);
  }
  return map;
}

function toSelected(c: Candidate): SelectedItem {
  return { productId: c.id, name: c.name, price_cop: c.price_cop, food_group: c.food_group, qty: 1 };
}

/**
 * Randomly upgrades away from `baseline` (assumed affordable) to a pricier
 * candidate from the same pool, but only ever within `maxExtraBudget` of
 * baseline's price — the caller already proved baseline fits, so capping
 * the swap to that budget means the upgrade can't un-prove it.
 */
function pickVariedAlternative(
  candidates: Candidate[],
  baseline: Candidate,
  maxExtraBudget: number
): { item: Candidate; extraCost: number } {
  // Baseline (price diff 0) always qualifies, so it's always in this pool —
  // the random pick can land back on it. An earlier version filtered
  // baseline out of the candidate pool and only randomized among the
  // *upgrades*, which meant it upgraded 100% of the time whenever any
  // affordable upgrade existed instead of sometimes staying cheap.
  const pool = candidates.filter((c) => c.price_cop - baseline.price_cop <= maxExtraBudget);
  if (pool.length <= 1) return { item: baseline, extraCost: 0 };
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { item: pick, extraCost: pick.price_cop - baseline.price_cop };
}

export type ProteinSelectionResult =
  | { feasible: true; items: SelectedItem[]; warnings: string[] }
  | { feasible: false; warnings: string[]; minimumCost: number };

/**
 * Guarantees protein variety structurally instead of hoping a greedy
 * cheapest-first pass happens to pick more than chicken: tries to buy one
 * item from every one of the 5 subtypes before spending anything on a
 * second unit of any of them. This is the direct fix for the hand-built
 * static plan forgetting red meat entirely.
 */
export function selectProteins(
  byFoodGroup: Map<FoodGroup, Candidate[]>,
  budget: number
): ProteinSelectionResult {
  const warnings: string[] = [];
  const cheapestBySubtype = new Map<FoodGroup, Candidate>();

  for (const subtype of PROTEIN_SUBTYPES) {
    const list = byFoodGroup.get(subtype) ?? [];
    if (list.length === 0) continue;
    cheapestBySubtype.set(subtype, list.reduce((a, b) => (a.price_cop <= b.price_cop ? a : b)));
  }

  if (cheapestBySubtype.size === 0) {
    return { feasible: false, warnings: ["No quedó ninguna proteína disponible después de tus exclusiones."], minimumCost: Infinity };
  }

  // Drop the priciest subtype first, but never below 2 unless we have no choice.
  let kept = [...cheapestBySubtype.keys()].sort(
    (a, b) => cheapestBySubtype.get(b)!.price_cop - cheapestBySubtype.get(a)!.price_cop
  );
  const sumKept = () => kept.reduce((s, st) => s + cheapestBySubtype.get(st)!.price_cop, 0);

  while (sumKept() > budget && kept.length > 2) {
    const dropped = kept.shift()!;
    warnings.push(`Presupuesto ajustado: no alcanzó para incluir ${PROTEIN_LABELS[dropped] ?? dropped} esta semana.`);
  }
  while (sumKept() > budget && kept.length > 1) {
    const dropped = kept.shift()!;
    warnings.push(`Presupuesto ajustado: no alcanzó para incluir ${PROTEIN_LABELS[dropped] ?? dropped} esta semana.`);
  }

  if (sumKept() > budget) {
    const minimumCost = Math.min(...[...cheapestBySubtype.values()].map((c) => c.price_cop));
    return { feasible: false, warnings, minimumCost };
  }

  // Baseline is the cheapest per subtype (guaranteed to fit — that's what
  // sumKept() just verified), but buying the literal cheapest chicken brand
  // every single time makes back-to-back generations (and the 4 weeks of a
  // monthly plan) look identical. Try to upgrade each kept subtype to a
  // random pricier alternative from the same subtype, only spending the
  // *difference* out of the leftover budget — so the swap can never push
  // the total over budget, it can only eat into the room already proven
  // to exist.
  const selected = new Map<string, SelectedItem>();
  let remaining = budget - sumKept();
  for (const st of kept) {
    const cheapest = cheapestBySubtype.get(st)!;
    const candidates = byFoodGroup.get(st) ?? [];
    const upgrade = pickVariedAlternative(candidates, cheapest, remaining);
    selected.set(upgrade.item.id, toSelected(upgrade.item));
    remaining -= upgrade.extraCost;
  }

  // Spend any leftover protein budget on more variety/quantity, cheapest
  // affordable item first, across every subtype (not just the ones kept
  // above) — capped so one week doesn't turn into six kinds of meat.
  const allCandidates = PROTEIN_SUBTYPES.flatMap((st) => byFoodGroup.get(st) ?? []).sort(
    (a, b) => a.price_cop - b.price_cop
  );
  let totalItems = selected.size;
  for (const c of allCandidates) {
    if (totalItems >= MAX_PROTEIN_ITEMS) break;
    if (c.price_cop > remaining) break; // sorted ascending — nothing cheaper left
    const existing = selected.get(c.id);
    if (existing) {
      existing.qty += 1;
    } else {
      selected.set(c.id, toSelected(c));
      totalItems++;
    }
    remaining -= c.price_cop;
  }

  return { feasible: true, items: [...selected.values()], warnings };
}

/**
 * Non-protein groups don't need the variety guarantee — pick from the
 * cheaper half at random (not strictly cheapest) so regenerating the same
 * budget doesn't always land on the exact same rice brand.
 */
const MAX_QTY_PER_SIMPLE_ITEM = 3;

export function selectSimpleGroup(
  candidates: Candidate[],
  budget: number
): SelectedItem[] {
  if (candidates.length === 0 || budget <= 0) return [];

  const sorted = [...candidates].sort((a, b) => a.price_cop - b.price_cop);
  const cheaperHalf = sorted.slice(0, Math.max(Math.ceil(sorted.length / 2), 1));
  const shuffled = [...cheaperHalf].sort(() => Math.random() - 0.5);

  const selected = new Map<string, SelectedItem>();
  let remaining = budget;

  // First pass: variety — random order so regenerating doesn't always land
  // on the same brand, capped at MAX_ITEMS_PER_SIMPLE_GROUP distinct items.
  for (const c of shuffled) {
    if (selected.size >= MAX_ITEMS_PER_SIMPLE_GROUP) break;
    if (c.price_cop > remaining) continue;
    selected.set(c.id, toSelected(c));
    remaining -= c.price_cop;
  }

  // Second pass: a single variety-first pass routinely leaves most of a
  // group's budget unspent (3 items at ~2.000-5.000 COP each vs. a
  // 15.000-20.000 COP allocation) — top up with more units of what's
  // already picked, cheapest-first, until nothing affordable is left.
  // A few bounded sweeps (not one) so quantities actually climb toward
  // MAX_QTY_PER_SIMPLE_ITEM instead of gaining at most +1 per product;
  // each sweep can only ever shrink `remaining` or leave it unchanged, so
  // capping the sweep count is just a budget guard, not a correctness one.
  for (let sweep = 0; sweep < MAX_QTY_PER_SIMPLE_ITEM; sweep++) {
    const before = remaining;
    for (const c of sorted) {
      if (c.price_cop > remaining) break;
      const existing = selected.get(c.id);
      if (existing && existing.qty < MAX_QTY_PER_SIMPLE_ITEM) {
        existing.qty += 1;
        remaining -= c.price_cop;
      } else if (!existing && selected.size < MAX_ITEMS_PER_SIMPLE_GROUP + 2) {
        selected.set(c.id, toSelected(c));
        remaining -= c.price_cop;
      }
    }
    if (remaining === before) break; // nothing changed this sweep, no point continuing
  }

  return [...selected.values()];
}

export function selectAllSimpleGroups(
  byFoodGroup: Map<FoodGroup, Candidate[]>,
  totalBudget: number
): SelectedItem[] {
  return SIMPLE_FOOD_GROUPS.flatMap((group) =>
    selectSimpleGroup(byFoodGroup.get(group) ?? [], totalBudget * BUDGET_SHARES[group])
  );
}

export function cheapestOverall(pool: Candidate[]): number | null {
  if (pool.length === 0) return null;
  return Math.min(...pool.map((p) => p.price_cop));
}
