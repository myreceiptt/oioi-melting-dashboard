export const LORE_LANGUAGES = [
  {
    code: "en",
    fileName: "LORE.en.md",
    label: "English",
  },
  {
    code: "de",
    fileName: "LORE.de.md",
    label: "Deutsch",
  },
  {
    code: "id",
    fileName: "LORE.id.md",
    label: "Indonesia",
  },
] as const;

export type LoreLanguageCode = (typeof LORE_LANGUAGES)[number]["code"];
