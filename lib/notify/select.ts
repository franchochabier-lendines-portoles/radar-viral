import { COUNTRIES, type Country } from "@/lib/config";
import { fitsProfile } from "@/lib/classify/affinity";
import { isExcluded } from "@/lib/classify/exclusion";
import type { Story } from "@/lib/types";

const PER_COUNTRY = 6;
const PER_TOPIC = 2;

export type DigestSelection = Array<{ country: Country; stories: Story[] }>;

/** Las más virales de cada país que encajan en el perfil editorial, como mucho dos por topic. */
export const selectForDigest = (stories: readonly Story[]): DigestSelection =>
  COUNTRIES.map((country) => {
    const picked: Story[] = [];
    for (const story of stories) {
      if (story.country !== country || !fitsProfile(story.themes) || isExcluded(story.title, story.topic)) continue;
      if (picked.filter((p) => p.topic === story.topic).length >= PER_TOPIC) continue;
      picked.push(story);
      if (picked.length === PER_COUNTRY) break;
    }
    return { country, stories: picked };
  }).filter((group) => group.stories.length > 0);
