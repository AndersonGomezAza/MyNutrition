/**
 * Keyword-based categorization. The source site doesn't expose a category
 * for this catalog view, so this is a heuristic — expect some misses, and
 * treat "category" (display grouping) and "foodGroup" (generator input) as
 * separate concerns matched independently, since a product's shelf category
 * and its role in a meal plan aren't the same axis.
 *
 * Ordered top-to-bottom, first match wins — order matters where keywords
 * could collide (e.g. "tomate de árbol" must be checked before the bare
 * "tomate" vegetable rule, or it would be mis-tagged as a vegetable).
 */

export type FoodGroup =
  | "protein_red_meat"
  | "protein_poultry"
  | "protein_fish"
  | "protein_egg"
  | "protein_legume"
  | "carb"
  | "dairy"
  | "fruit"
  | "vegetable"
  | "fat_oil"
  | "other";

const CATEGORY_RULES: Array<[string, string[]]> = [
  ["Bebés", ["pañal", "toallita húmeda", "leche de fórmula", "biberón", "compota", "cereal para bebé", "cereales para bebé", "paño húmedo para bebé", "paños húmedos para bebé", "crema humectante para bebé"]],
  ["Mascotas", ["gato", "perro", "mascota", "arena sanitaria", "concentrado para"]],
  ["Licores", ["cerveza", "ron ", "aguardiente", "whisky", "vino ", "vodka", "tequila"]],
  ["Aseo del Hogar", ["detergente", "blanqueador", "suavizante", "limpiador", "desinfectante", "lavaplatos", "esponja", "bolsa de basura", "bolsas para basura", "escoba", "trapero", "papel higiénico", "servilleta", "vasos desechables", "platos desechables", "cubiertos desechables", "varsol", "ambientador", "repuesto de escoba", "palillos"]],
  ["Cuidado Personal", ["shampoo", "champú", "jabón", "crema dental", "desodorante", "cepillo de dientes", "toalla higiénica", "toallas higiénicas", "pañitos", "afeitar", "acondicionador", "protector solar", "crema humectante", "protectores diarios"]],
  ["Panadería", ["pan ", "pandeyuca", "pandebono", "arepa", "tostada", "ponqué", "torta ", "gofres"]],
  ["Bebidas", ["gaseosa", "jugo", "néctar", "refresco", "energizante", "agua ", "té ", "malteada", "bebida nutricional", "café", "chocolate de mesa", "bebida achocolatada"]],
  ["Frutas y Verduras", ["manzana", "naranja", "plátano", "papaya", "guayaba", "pera ", "mora", "fresa", "tomate", "cebolla", "espinaca", "lechuga", "pepino", "pimentón", "apio", "aguacate", "zanahoria", "banano", "papa "]],
  ["Carnes y Pescados", ["pollo", "carne de res", "carne de cerdo", "pechuga", "atún", "tilapia", "salmón", "pescado", "chorizo", "salchich", "jamón", "tocineta", "mortadela", "camarones", "camarón", "costilla"]],
  ["Refrigerados", ["leche ", "yogur", "queso", "quesillo", "crema de leche", "mantequilla", "margarina", "huevos"]],
  ["Dulces y Pasabocas", ["galleta", "chocolatina", "bombón", "papas fritas", "nachos", "chicle", "gomita", "helado", "mermelada", "dulce", "pasabocas", "brownie", "maní", "chocolate esparcible", "arequipe", "gelatina"]],
  ["Despensa", ["arroz", "lenteja", "fríjol", "frijol", "garbanzo", "avena", "azúcar", "panela", "aceite", "harina", "pasta ", "espagueti", "tortillas", "salsa", "sardina", "sal ", "condimento", "caldo", "sopa", "granola", "miel de abejas", "mostaza", "vinagre", "polvo para hornear"]],
];

const FOOD_GROUP_RULES: Array<[FoodGroup, string[]]> = [
  // Must come first: "Jamón de Pollo" contains "pollo" and would otherwise
  // match protein_poultry below. Deli/processed meats are deliberately kept
  // out of every protein_* group so the generator's picks stay whole-food.
  ["other", ["jamón", "tocineta", "mortadela", "salchich", "chorizo"]],
  // Fruit before vegetable: "tomate de árbol" must win over the bare "tomate" rule below.
  ["fruit", ["manzana", "naranja", "plátano", "banano", "papaya", "guayaba", "pera ", "mora", "fresa", "mandarina", "limón", "piña", "durazno", "uva ", "melón", "sandía", "maracuyá", "lulo", "tomate de árbol", "kiwi"]],
  ["vegetable", ["tomate", "cebolla", "espinaca", "lechuga", "pimentón", "apio", "zanahoria", "repollo", "coliflor", "champiñón", "brócoli", "pepino", "calabaza", "calabacín", "habichuela"]],
  ["protein_egg", ["huevo"]],
  ["protein_fish", ["atún", "tilapia", "salmón", "sardina", "pescado", "camarón", "camarones", "trucha", "bagre"]],
  ["protein_poultry", ["pollo", "pechuga de pollo", "muslo de pollo", "pernil de pollo"]],
  // Deliberately specific ("carne de res", not bare "res"): processed meats like
  // chorizo/jamón/salchicha share substrings with these but are excluded on
  // purpose so the generator's protein picks stay whole-food, not deli meat.
  ["protein_red_meat", ["carne de res", "carne de cerdo", "costilla de res", "costilla de cerdo", "chuleta", "solomo", "carne molida", "bistec"]],
  ["protein_legume", ["lenteja", "fríjol", "frijol", "garbanzo", "arveja", "haba"]],
  ["dairy", ["leche ", "yogur", "queso", "quesillo", "crema de leche", "kumis", "cuajada"]],
  ["carb", ["arroz", "avena", "pan ", "pasta ", "espagueti", "papa ", "harina", "tortilla", "arepa", "pandebono", "pandeyuca"]],
  ["fat_oil", ["aceite", "margarina", "mantequilla"]],
];

function matchFirst<T extends string>(
  name: string,
  rules: Array<[T, string[]]>,
  fallback: T
): T {
  const lower = name.toLowerCase();
  for (const [label, keywords] of rules) {
    if (keywords.some((k) => lower.includes(k))) return label;
  }
  return fallback;
}

export function categorizeProduct(name: string): {
  category: string;
  foodGroup: FoodGroup;
} {
  return {
    category: matchFirst(name, CATEGORY_RULES, "Varios"),
    foodGroup: matchFirst(name, FOOD_GROUP_RULES, "other"),
  };
}
