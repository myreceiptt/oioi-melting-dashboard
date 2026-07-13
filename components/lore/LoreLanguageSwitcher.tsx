"use client";

import { useRouter } from "next/navigation";
import {
  LORE_LANGUAGES,
  type LoreLanguageCode,
} from "@/lib/lore/loreLanguages";

type LoreLanguageSwitcherProps = {
  chapterSlug?: string;
  currentLanguage: LoreLanguageCode;
};

const LANGUAGE_SELECT_LABELS: Record<LoreLanguageCode, string> = {
  de: "Sprache Auswählen",
  en: "Select Language",
  id: "Pilih Bahasa",
};

const LANGUAGE_OPTION_LABELS: Record<
  LoreLanguageCode,
  Record<LoreLanguageCode, string>
> = {
  de: {
    de: "Deutsch",
    en: "Englisch",
    id: "Indonesisch",
  },
  en: {
    de: "German",
    en: "English",
    id: "Indonesian",
  },
  id: {
    de: "Bahasa Jerman",
    en: "Bahasa Inggris",
    id: "Bahasa Indonesia",
  },
};

export function LoreLanguageSwitcher({
  chapterSlug,
  currentLanguage,
}: LoreLanguageSwitcherProps) {
  const router = useRouter();

  function updateLanguage(language: string) {
    window.dispatchEvent(
      new CustomEvent("oioi:lore-language-change", {
        detail: {
          language,
        },
      }),
    );

    const target = chapterSlug
      ? `/lore/chapter/${chapterSlug}?lang=${language}`
      : `/lore?lang=${language}`;

    router.push(target);
  }

  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/60">
        {LANGUAGE_SELECT_LABELS[currentLanguage]}
      </span>
      <select
        className="w-full cursor-pointer rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none hover:bg-(--oioi-accent) focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
        onChange={(event) => updateLanguage(event.target.value)}
        value={currentLanguage}
      >
        {LORE_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {LANGUAGE_OPTION_LABELS[currentLanguage][language.code]}
          </option>
        ))}
      </select>
    </label>
  );
}
