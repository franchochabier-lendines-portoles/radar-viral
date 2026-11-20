import { WINDOW_HOURS, type Country } from "@/lib/config";
import { processItems } from "@/lib/classify/process";
import { clearAll, knownStories, saveIngest } from "@/lib/db/repository";
import type { RawItem, TrendingSearch } from "@/lib/types";
import { DEMO_EXCLUDED, DEMO_OUTLETS, DEMO_PROFILE_STORIES, DEMO_STORIES, DEMO_TRENDS, type DemoStory } from "./demo-data";

const HOUR_MS = 3_600_000;
const STEP_MINUTES = 20;

/** Generador pseudoaleatorio con semilla: la demo sale igual en cada ejecución. */
const seeded = (seed: number) => {
  let state = seed;
  return (): number => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

type Plan = DemoStory & { bornAt: number; peakOutlets: number; growthHours: number; outletOrder: number[]; fadeAfter: number };

const planStories = (now: number, random: () => number): Plan[] =>
  [...DEMO_STORIES, ...DEMO_PROFILE_STORIES, ...DEMO_EXCLUDED].map((story) => {
    const outlets = DEMO_OUTLETS[story.country];
    const order = outlets.map((_, i) => i).sort(() => random() - 0.5);
    return {
      ...story,
      bornAt: now - (1 + random() * (WINDOW_HOURS - 3)) * HOUR_MS,
      peakOutlets: 1 + Math.floor(random() * outlets.length),
      growthHours: 1 + random() * 6,
      outletOrder: order,
      fadeAfter: 10 + random() * 20,
    };
  });

const itemsAt = (plans: Plan[], at: number): RawItem[] =>
  plans.flatMap((plan, index) => {
    if (plan.bornAt > at) return [];
    const ageHours = (at - plan.bornAt) / HOUR_MS;
    if (ageHours > plan.fadeAfter) return [];
    const outlets = DEMO_OUTLETS[plan.country];
    const reached = Math.max(1, Math.round(plan.peakOutlets * Math.min(1, ageHours / plan.growthHours)));
    return plan.outletOrder.slice(0, reached).map((outletIndex, rank) => {
      const outlet = outlets[outletIndex] ?? outlets[0] ?? { name: "Demo", domain: "demo.local" };
      return {
        country: plan.country,
        topicHint: plan.topic,
        title: plan.title,
        url: `https://${outlet.domain}/demo/${index}`,
        sourceName: outlet.name,
        sourceDomain: outlet.domain,
        publishedAt: plan.bornAt + rank * 17 * 60_000,
        feedPosition: index % 12,
        feedSize: 12,
      };
    });
  });

const demoTrends = (): TrendingSearch[] =>
  (Object.entries(DEMO_TRENDS) as Array<[Country, Array<[string, number]>]>).flatMap(([country, list]) =>
    list.map(([query, traffic]) => ({ country, query, traffic })),
  );

const run = (): void => {
  const now = Date.now();
  const random = seeded(2026);
  const plans = planStories(now, random);
  const trends = demoTrends();
  clearAll();

  let ingests = 0;
  for (let at = now - WINDOW_HOURS * HOUR_MS; at <= now; at += STEP_MINUTES * 60_000) {
    const stories = processItems(itemsAt(plans, at), trends, knownStories(at - WINDOW_HOURS * HOUR_MS), at);
    saveIngest({ stories, trends, at, demo: true });
    ingests += 1;
  }
  console.log(`Demo cargada: ${ingests} lecturas simuladas en las últimas ${WINDOW_HOURS} h.`);
};

run();
