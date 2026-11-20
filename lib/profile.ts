import type { Topic } from "@/lib/config";

/**
 * Perfil editorial: los temas generales de una línea de contenidos de servicio y curiosidades. Se buscan noticias virales de cualquier medio sobre esos mismos temas.
 *
 * Los términos van normalizados (minúsculas y sin tildes). "*" al final = prefijo.
 * Para ajustar el perfil basta con tocar esta lista.
 */

export const THEME_IDS = [
  "hogar",
  "dinero",
  "consumo",
  "cocina",
  "psicologia",
  "salud",
  "mascotas",
  "tiempo",
  "calendario",
  "frases",
  "historias",
  "motor",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type Lang = "es" | "en" | "fr";

export type Theme = {
  id: ThemeId;
  label: string;
  /** Topic del radar en el que encaja. */
  topic: Topic;
  terms: Record<Lang, readonly string[]>;
  /** Búsqueda en Google News que trae este tipo de noticias. */
  search: Record<Lang, string>;
};

export const THEMES: readonly Theme[] = [
  {
    id: "hogar",
    label: "Casa y trucos",
    topic: "curiosidades",
    terms: {
      es: ["vinagre", "bicarbonato", "papel de aluminio", "papel de horno", "lavadora", "mampara*", "inodoro", "nevera", "humedad", "condensacion", "moho", "manchas", "truco", "trucos", "limpiar", "limpieza", "albanil*", "fontaner*", "calefaccion", "radiador*", "azulejo*", "decoracion", "persianas", "plancha", "almohada*", "cactus de navidad", "plantas de interior"],
      en: ["vinegar", "baking soda", "washing machine", "mould", "mold", "condensation", "radiator*", "cleaning", "hack", "hacks", "declutter*", "tumble dryer", "houseplant*"],
      fr: ["vinaigre", "bicarbonate", "machine a laver", "moisissure*", "astuce*", "menage", "nettoyer", "radiateur*", "condensation", "plantes d interieur"],
    },
    search: {
      es: "truco casa OR vinagre OR limpieza OR humedad OR albañiles OR fontaneros",
      en: "cleaning hack OR vinegar OR mould OR condensation OR radiator",
      fr: "astuce ménage OR vinaigre OR moisissure OR condensation",
    },
  },
  {
    id: "dinero",
    label: "Hacienda, pensiones y dinero",
    topic: "economia",
    terms: {
      es: ["hacienda", "pension*", "jubilad*", "jubilacion", "irpf", "declaracion de la renta", "herencia*", "heredero*", "seguridad social", "inss", "sepe", "subsidio", "ibi", "cajero", "efectivo", "cotiz*", "ingreso minimo", "nomina*", "bizum", "usucapion", "seguro de vida"],
      en: ["pension*", "state pension", "hmrc", "irs", "tax refund", "retire*", "inheritance", "council tax", "dwp", "benefits", "social security", "savings", "cash", "401k"],
      fr: ["retraite*", "impots", "fisc", "heritage", "caf", "allocation*", "livret a", "pension*", "urssaf"],
    },
    search: {
      es: "Hacienda OR jubilación OR pensión OR herencia OR Seguridad Social OR BOE",
      en: "pension OR retirement OR HMRC OR IRS OR inheritance OR social security",
      fr: "retraite OR impôts OR héritage OR CAF OR fisc",
    },
  },
  {
    id: "consumo",
    label: "Consumo y supermercados",
    topic: "economia",
    terms: {
      es: ["mercadona", "lidl", "aldi", "carrefour", "ikea", "supermercado*", "ocu", "black friday", "rebajas", "factura de la luz", "precio de la luz"],
      en: ["tesco", "aldi", "lidl", "sainsbury*", "costco", "walmart", "trader joe s", "black friday", "supermarket*"],
      fr: ["leclerc", "carrefour", "lidl", "aldi", "intermarche", "black friday", "supermarche*"],
    },
    search: {
      es: "Mercadona OR Lidl OR Aldi OR supermercado OR OCU",
      en: "Aldi OR Lidl OR Tesco OR Costco OR supermarket",
      fr: "Lidl OR Leclerc OR Aldi OR supermarché",
    },
  },
  {
    id: "cocina",
    label: "Cocina y trucos de chef",
    topic: "curiosidades",
    terms: {
      es: ["receta*", "chef", "chefs", "cociner*", "tortilla", "lentejas", "arroz", "paella", "freir", "sarten", "freidora de aire", "airfryer", "cocido", "croquetas"],
      en: ["recipe*", "chef", "chefs", "air fryer", "cooking", "roast potatoes", "baking"],
      fr: ["recette*", "chef", "chefs", "cuisine", "friteuse", "cuisson"],
    },
    search: {
      es: "chef truco OR receta OR cocineros",
      en: "chef tip OR recipe OR air fryer",
      fr: "astuce de chef OR recette",
    },
  },
  {
    id: "psicologia",
    label: "Psicología y longevidad",
    topic: "curiosidades",
    terms: {
      es: ["psicolog*", "psiquiatr*", "personalidad", "longevidad", "felicidad", "la ciencia", "expertos coinciden", "los expertos"],
      en: ["psycholog*", "longevity", "happiness", "personality", "experts say", "according to experts", "neuroscien*"],
      fr: ["psycholog*", "longevite", "bonheur", "personnalite", "selon les experts"],
    },
    search: {
      es: "la psicología OR psicólogos OR longevidad",
      en: "psychology says OR psychologists OR longevity",
      fr: "psychologie OR psychologues OR longévité",
    },
  },
  {
    id: "salud",
    label: "Salud práctica",
    topic: "curiosidades",
    terms: {
      es: ["medico*", "neurolog*", "dermatolog*", "cardiolog*", "nutricionista*", "medicament*", "resfriado", "gripe", "dormir", "colesterol", "higado", "crema"],
      en: ["doctor*", "nutritionist*", "dermatologist*", "sleep", "flu", "gut health", "liver", "cholesterol"],
      fr: ["medecin*", "dermatologue*", "nutritionniste*", "sommeil", "grippe", "cholesterol"],
    },
    search: {
      es: "médico advierte OR dermatóloga OR nutricionista OR neurólogo",
      en: "doctor warns OR nutritionist OR dermatologist",
      fr: "médecin alerte OR nutritionniste OR dermatologue",
    },
  },
  {
    id: "mascotas",
    label: "Mascotas",
    topic: "curiosidades",
    terms: {
      es: ["perro", "perros", "gato", "gatos", "veterinari*", "mascota*", "cachorro*", "adiestrador*", "ley de bienestar animal"],
      en: ["dog", "dogs", "cat", "cats", "vet", "vets", "puppy", "puppies", "pet", "pets"],
      fr: ["chien", "chiens", "chat", "chats", "veterinaire*", "animaux de compagnie", "chiot*"],
    },
    search: {
      es: "veterinarios OR perros OR gatos OR mascotas",
      en: "vets OR dog owners OR cat owners OR pets",
      fr: "vétérinaires OR chiens OR chats",
    },
  },
  {
    id: "tiempo",
    label: "El tiempo",
    topic: "novedades",
    terms: {
      es: ["aemet", "jorge rey", "meteorolog*", "dana", "ola de frio", "ola de calor", "borrasca", "nieve", "aviso amarillo", "alerta amarilla", "aviso naranja", "lluvias"],
      en: ["met office", "weather warning", "snow", "heatwave", "storm", "frost", "forecast"],
      fr: ["meteo france", "vigilance", "neige", "canicule", "tempete", "gel"],
    },
    search: {
      es: "AEMET OR Jorge Rey OR borrasca OR aviso amarillo",
      en: "Met Office OR weather warning OR snow forecast",
      fr: "Météo-France OR vigilance OR neige",
    },
  },
  {
    id: "calendario",
    label: "Festivos y calendario",
    topic: "eventos",
    terms: {
      es: ["puente", "festivo*", "cambio de hora", "calendario laboral", "dia no laborable", "loteria de navidad"],
      en: ["bank holiday", "clocks go back", "clocks change", "daylight saving", "thanksgiving"],
      fr: ["jour ferie", "pont de", "changement d heure", "calendrier"],
    },
    search: {
      es: "puente festivo OR calendario laboral OR Lotería de Navidad",
      en: "bank holiday OR clocks change",
      fr: "jour férié OR pont",
    },
  },
  {
    id: "frases",
    label: "Frases y reflexiones",
    topic: "curiosidades",
    terms: {
      es: ["reflexion", "frase", "proverbio", "cita de", "la leccion de"],
      en: ["quote", "famous quote", "once said", "proverb"],
      fr: ["citation", "proverbe", "reflexion"],
    },
    search: {
      es: "la reflexión de OR la frase de",
      en: "famous quote OR once said",
      fr: "citation OR la réflexion de",
    },
  },
  {
    id: "historias",
    label: "Testimonios y curiosidades",
    topic: "curiosidades",
    terms: {
      es: ["jubilado", "espanol que vive en", "espanola que vive en", "trabajando en", "voluntarios", "vivir gratis", "pueblo", "arqueolog*", "hallazgo", "hallan", "descubren", "insolit*", "curios*", "no dan credito", "viral"],
      en: ["archaeolog*", "discovered", "village", "volunteers", "live for free", "living in", "bizarre", "viral"],
      fr: ["archeolog*", "village", "insolite", "decouverte", "viral"],
    },
    search: {
      es: "arqueólogos hallan OR vivir gratis OR jubilado cuenta OR español que vive en",
      en: "archaeologists discover OR live for free OR village",
      fr: "archéologues OR insolite OR village",
    },
  },
  {
    id: "motor",
    label: "Motor y normas de tráfico",
    topic: "novedades",
    terms: {
      es: ["dgt", "multa*", "itv", "baliza v16", "v16", "carnet de conducir", "neumatico*", "mecanico*", "gasolina", "gasolinera*", "conductor*"],
      en: ["dvla", "mot", "speed camera*", "tyre*", "tire*", "driving licence", "drivers license", "petrol", "motorists", "drivers"],
      fr: ["permis de conduire", "pneu*", "radar*", "amende*", "carburant", "automobilistes"],
    },
    search: {
      es: "DGT OR multa conductores OR ITV OR mecánicos",
      en: "drivers warned OR DVLA OR speed cameras OR tyre",
      fr: "automobilistes OR permis de conduire OR amende",
    },
  },
];

export const THEME_BY_ID: Record<ThemeId, Theme> = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
