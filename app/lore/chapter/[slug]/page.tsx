import Link from "next/link";
import type { Metadata } from "next";
import { InvalidPage } from "@/components/app/InvalidPage";
import { LoreLanguageSwitcher } from "@/components/lore/LoreLanguageSwitcher";
import { LoreMarkdown } from "@/components/lore/LoreMarkdown";
import {
  getLoreChapter,
  getLorePlainText,
  normalizeLoreLanguage,
} from "@/lib/lore/loreContent";
import type { LoreLanguageCode } from "@/lib/lore/loreLanguages";

type LoreChapterPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

const CHAPTER_LABELS: Record<LoreLanguageCode, string> = {
  de: "Kapitel",
  en: "Chapter",
  id: "Babak",
};

export async function generateMetadata({
  params,
  searchParams,
}: LoreChapterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const chapterResult = await getLoreChapter(slug, lang);

  if (!chapterResult) {
    return {
      title: "Lore Chapter",
    };
  }

  return {
    description: chapterResult.chapter.excerpt,
    title: getLorePlainText(chapterResult.chapter.title),
  };
}

export default async function LoreChapterPage({
  params,
  searchParams,
}: LoreChapterPageProps) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const language = normalizeLoreLanguage(lang);
  const chapterResult = await getLoreChapter(slug, language);

  if (!chapterResult) {
    return (
      <InvalidPage
        actionLabel="Back to Lore"
        eyebrow="Lore Chapter"
        href={`/lore?lang=${language}`}
        message="This lore chapter does not exist in the current archive."
        title="Invalid lore chapter"
      />
    );
  }

  const { chapter, document } = chapterResult;
  const surfaceIndex = document.surfaces.findIndex(
    (surface) => surface.title === chapter.surfaceTitle,
  );
  const surfaceNumber = surfaceIndex > -1 ? surfaceIndex + 1 : 1;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <Link
            className="text-sm text-white/70 underline"
            href={`/lore?lang=${document.language}`}>
            ← {getLorePlainText(chapter.surfaceTitle)}
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/70">
            {CHAPTER_LABELS[document.language]} 0{String(surfaceNumber)}.
            {String(chapter.chapterNumber).padStart(2, "0")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {getLorePlainText(chapter.title)}
          </h1>
        </div>
        <div className="mt-6">
          <LoreLanguageSwitcher
            chapterSlug={chapter.slug}
            currentLanguage={document.language}
          />
        </div>
      </header>

      <section className="grid gap-5 scroll-mt-30" id="contract-list">
        <section className="rounded-3xl border border-white/10 bg-black p-6">
          <hr className="my-8 border-white/10" />
          <LoreMarkdown content={chapter.body} />
        </section>
      </section>
    </main>
  );
}
