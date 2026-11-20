import { THEMES, type Lang, type ThemeId } from "@/lib/profile";
import { findTerms, normalize } from "./text";

/** Temas del perfil editorial que encajan con un titular, de más a menos coincidencias. */
export const matchThemes = (title: string, lang: Lang): ThemeId[] => {
  const text = normalize(title);
  return THEMES.map((theme) => ({ id: theme.id, hits: findTerms(text, theme.terms[lang]).length }))
    .filter((match) => match.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((match) => match.id);
};

export const fitsProfile = (themes: readonly ThemeId[]): boolean => themes.length > 0;
