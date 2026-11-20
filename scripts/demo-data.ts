/**
 * Titulares INVENTADOS para ver el radar sin conexión. En España se reparten al azar
 * entre los medios reales del catálogo solo para poder ver el desglose: ni los
 * titulares ni las cifras son de esos medios.
 */
import { ES_OUTLETS, type Country, type Topic } from "@/lib/config";

export type DemoStory = { country: Country; topic: Topic; title: string };

const S = (country: Country, topic: Topic, titles: string[]): DemoStory[] =>
  titles.map((title) => ({ country, topic, title }));

export const DEMO_STORIES: DemoStory[] = [
  ...S("ES", "internacional", [
    "Un terremoto de magnitud 6,1 sacude el norte de Japón sin causar víctimas",
    "La ONU alerta de una sequía histórica en el Cuerno de África",
    "Islandia evacúa Grindavik ante una nueva erupción volcánica",
  ]),
  ...S("ES", "curiosidades", [
    "Hallan en un desván de Cuenca una carta de 1890 que nunca llegó a su destino",
    "Un pulpo aprende a abrir botes de cristal en el Aquarium de Gijón y se hace viral",
    "El pueblo de Teruel donde todos los vecinos comparten el mismo apellido",
  ]),
  ...S("ES", "jardineria", [
    "Cinco plantas de interior que sobreviven al invierno sin apenas luz",
    "Cómo podar los rosales en noviembre para que florezcan en primavera",
    "El truco de la cáscara de plátano para abonar el huerto que arrasa en redes",
  ]),
  ...S("ES", "eventos", [
    "Las luces de Navidad de Vigo se encenderán el sábado con 12 millones de bombillas",
    "El festival Mad Cool anuncia sus primeros cabezas de cartel para 2027",
    "La exposición de Sorolla en el Prado agota las entradas del primer mes",
  ]),
  ...S("ES", "economia", [
    "El euríbor cae por debajo del 2% y abarata las hipotecas variables",
    "El precio del aceite de oliva baja un 30% en los supermercados",
    "El IPC se modera al 2,1% en noviembre por el abaratamiento de la luz",
  ]),
  ...S("ES", "novedades", [
    "WhatsApp lanza la traducción automática de mensajes de voz en español",
    "Llega a España el primer móvil plegable de menos de 500 euros",
    "La DGT activa la nueva app con el carnet de conducir digital",
  ]),
  ...S("GB", "internacional", [
    "Iceland evacuates Grindavik as new volcanic eruption begins",
    "UN warns of record drought across the Horn of Africa",
    "Magnitude 6.1 earthquake strikes northern Japan with no casualties reported",
  ]),
  ...S("GB", "curiosidades", [
    "Man finds 1950s time capsule buried under his Bristol garden shed",
    "Seal pup spotted napping on a Cornwall surfboard becomes internet star",
    "Village pub in Yorkshire serves the same customer for 70 years",
  ]),
  ...S("GB", "jardineria", [
    "Monty Don shares the one job every gardener should do before the first frost",
    "Allotment waiting lists hit record high across England",
    "Houseplants that thrive in cold north facing rooms this winter",
  ]),
  ...S("GB", "eventos", [
    "Winter Wonderland opens in Hyde Park with new ice rink and rides",
    "Glastonbury 2027 ticket resale date confirmed for spring",
    "Christmas lights switch on at Oxford Street draws thousands",
  ]),
  ...S("GB", "economia", [
    "Bank of England holds interest rates as inflation eases to 2.3%",
    "Supermarket food prices fall for the first time in four years",
    "Mortgage rates drop below 4% as lenders cut deals",
  ]),
  ...S("GB", "novedades", [
    "Apple launches iPhone repair kit for UK customers",
    "Royal Mail trials drone deliveries to Scottish islands",
    "New AI tool lets NHS patients book appointments by voice",
  ]),
  ...S("FR", "internacional", [
    "L'Islande évacue Grindavik après une nouvelle éruption volcanique",
    "Séisme de magnitude 6,1 dans le nord du Japon sans victimes",
    "L'ONU alerte sur une sécheresse historique dans la Corne de l'Afrique",
  ]),
  ...S("FR", "curiosidades", [
    "Un chat retrouve sa famille après avoir parcouru 600 kilomètres en Bretagne",
    "Insolite : un village du Jura vend son église pour un euro symbolique",
    "Une bouteille à la mer lancée en 1985 retrouvée sur une plage de Vendée",
  ]),
  ...S("FR", "jardineria", [
    "Jardinage : les cinq plantes à rentrer avant les premières gelées",
    "Potager d'hiver : ce qu'il faut semer en novembre",
    "Le marc de café au jardin, vraie astuce ou fausse bonne idée",
  ]),
  ...S("FR", "eventos", [
    "Le marché de Noël de Strasbourg ouvre avec 300 chalets",
    "La Fête des Lumières de Lyon dévoile son programme 2026",
    "Une exposition Monet inédite ouvre au musée d'Orsay",
  ]),
  ...S("FR", "economia", [
    "L'inflation ralentit à 1,4 % en novembre selon l'Insee",
    "Le prix du carburant passe sous 1,70 euro le litre",
    "Les taux des crédits immobiliers baissent pour le sixième mois",
  ]),
  ...S("FR", "novedades", [
    "La SNCF lance un abonnement illimité pour les moins de 27 ans",
    "Mistral AI dévoile un assistant vocal en français",
    "La carte Vitale sur smartphone généralisée en janvier",
  ]),
  ...S("US", "internacional", [
    "Iceland evacuates Grindavik as volcano erupts again",
    "Magnitude 6.1 earthquake shakes northern Japan, no casualties",
    "UN warns Horn of Africa faces record drought",
  ]),
  ...S("US", "curiosidades", [
    "Texas man wins lottery twice in one week with the same numbers",
    "Raccoon caught on camera stealing Halloween candy goes viral",
    "Oregon town elects a dog as honorary fire chief",
  ]),
  ...S("US", "jardineria", [
    "Gardeners urged to leave fallen leaves on lawns this fall",
    "The houseplant trend taking over TikTok this winter",
    "How to overwinter tomato plants indoors",
  ]),
  ...S("US", "eventos", [
    "Macy's Thanksgiving Day Parade reveals five new balloons",
    "Rockefeller Center Christmas tree arrives in Manhattan",
    "Coachella 2027 lineup leak sends fans into frenzy",
  ]),
  ...S("US", "economia", [
    "Gas prices fall to lowest level in three years ahead of Thanksgiving",
    "Mortgage rates dip to 5.9% as housing market thaws",
    "Holiday retail sales forecast to break records",
  ]),
  ...S("US", "novedades", [
    "Google unveils AI search mode for Gmail",
    "Tesla launches cheaper Model Y in the US",
    "NASA confirms new launch date for Artemis III",
  ]),
];

/** Titulares inventados del estilo del perfil editorial (lib/profile.ts). */
export const DEMO_PROFILE_STORIES: DemoStory[] = [
  ...S("ES", "economia", [
    "Hacienda lo confirma: los jubilados que saquen más de 3.000 euros en efectivo del cajero tendrán que justificarlo",
    "Mercadona cambia el sistema de pago en sus cajas y los clientes ya notan la diferencia",
    "El BOE lo hace oficial: la pensión de viudedad sube a partir de enero para estos jubilados",
  ]),
  ...S("ES", "curiosidades", [
    "Los fontaneros coinciden: echar vinagre en el desagüe una vez al mes evita los malos olores",
    "La psicología explica por qué las personas que llegan siempre pronto tienen este rasgo de personalidad",
    "Los veterinarios coinciden: los perros que te siguen al baño no lo hacen por curiosidad",
    "Un chef vasco revela el truco para que las lentejas queden melosas sin añadir chorizo",
    "La reflexión de Clint Eastwood sobre la vejez que se ha hecho viral",
  ]),
  ...S("ES", "novedades", [
    "La AEMET activa el aviso amarillo por nieve en cinco comunidades este fin de semana",
    "La DGT recuerda la multa de 200 euros por no llevar la baliza V16 desde enero",
  ]),
  ...S("ES", "eventos", ["El BOE confirma el puente de diciembre en nueve comunidades autónomas"]),
  ...S("GB", "economia", [
    "State pension rise confirmed for April: what retirees will get",
    "Aldi shoppers queue for £20 heated airer ahead of winter",
  ]),
  ...S("GB", "curiosidades", [
    "Cleaning expert shares vinegar hack that stops condensation on windows overnight",
    "Vets warn dog owners about the hidden danger of conkers this autumn",
  ]),
  ...S("GB", "novedades", ["Met Office issues snow warning as temperatures plunge to minus 8"]),
  ...S("FR", "economia", ["Retraite : la revalorisation des pensions confirmée pour janvier"]),
  ...S("FR", "curiosidades", [
    "L'astuce au vinaigre pour éliminer la moisissure de la salle de bain",
    "Selon les vétérinaires, les chats qui dorment sur vos pieds vous protègent",
  ]),
  ...S("FR", "novedades", ["Météo-France place douze départements en vigilance neige"]),
  ...S("US", "economia", [
    "Social Security COLA increase for 2027: how much retirees will receive",
    "Costco shoppers rush to buy the $25 item selling out before Thanksgiving",
  ]),
  ...S("US", "curiosidades", [
    "Psychologists say people who reply late to texts share this personality trait",
    "Chef reveals the air fryer trick for crispy Thanksgiving potatoes",
  ]),
];

/** Titulares que el filtro debe tumbar: están para comprobar que funciona. */
export const DEMO_EXCLUDED: DemoStory[] = [
  { country: "ES", topic: "internacional", title: "Sánchez y Feijóo chocan en el Congreso por los presupuestos" },
  { country: "ES", topic: "curiosidades", title: "El Real Madrid celebra su victoria en el derbi con un vídeo viral" },
  { country: "GB", topic: "internacional", title: "Starmer faces Labour rebellion over budget vote" },
  { country: "FR", topic: "eventos", title: "Le PSG s'impose face à l'OM au Parc des Princes" },
  { country: "US", topic: "novedades", title: "Trump launches new campaign app ahead of midterm elections" },
  { country: "US", topic: "eventos", title: "Super Bowl halftime show performer announced" },
];

export const DEMO_OUTLETS: Record<Country, Array<{ name: string; domain: string }>> = {
  ES: ES_OUTLETS.map((o) => ({ name: o.name, domain: o.domains[0] ?? o.id })).concat([
    { name: "Europa Press", domain: "europapress.es" },
    { name: "Huffpost", domain: "huffingtonpost.es" },
  ]),
  GB: [
    { name: "BBC", domain: "bbc.co.uk" },
    { name: "The Guardian", domain: "theguardian.com" },
    { name: "The Independent", domain: "independent.co.uk" },
    { name: "Daily Mail", domain: "dailymail.co.uk" },
    { name: "Sky News", domain: "news.sky.com" },
    { name: "Metro", domain: "metro.co.uk" },
    { name: "Mirror", domain: "mirror.co.uk" },
    { name: "Evening Standard", domain: "standard.co.uk" },
  ],
  FR: [
    { name: "Le Monde", domain: "lemonde.fr" },
    { name: "Le Figaro", domain: "lefigaro.fr" },
    { name: "Libération", domain: "liberation.fr" },
    { name: "franceinfo", domain: "francetvinfo.fr" },
    { name: "Ouest-France", domain: "ouest-france.fr" },
    { name: "Le Parisien", domain: "leparisien.fr" },
    { name: "BFMTV", domain: "bfmtv.com" },
    { name: "20 Minutes", domain: "20minutes.fr" },
  ],
  US: [
    { name: "The New York Times", domain: "nytimes.com" },
    { name: "CNN", domain: "cnn.com" },
    { name: "AP News", domain: "apnews.com" },
    { name: "The Washington Post", domain: "washingtonpost.com" },
    { name: "NBC News", domain: "nbcnews.com" },
    { name: "USA Today", domain: "usatoday.com" },
    { name: "NPR", domain: "npr.org" },
    { name: "CBS News", domain: "cbsnews.com" },
  ],
};

export const DEMO_TRENDS: Record<Country, Array<[string, number]>> = {
  ES: [["aviso nieve aemet", 200_000], ["puente diciembre", 100_000], ["euribor", 200_000], ["luces navidad vigo", 100_000], ["terremoto japon", 50_000], ["whatsapp traduccion", 20_000], ["real madrid", 500_000]],
  GB: [["winter wonderland", 200_000], ["interest rates", 100_000], ["grindavik", 50_000], ["monty don", 20_000]],
  FR: [["marché de noël strasbourg", 100_000], ["inflation", 50_000], ["fête des lumières", 50_000], ["psg om", 500_000]],
  US: [["macy's parade", 500_000], ["gas prices", 200_000], ["rockefeller tree", 100_000], ["artemis iii", 50_000]],
};
