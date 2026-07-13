import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { LoreLanguageSwitcher } from "@/components/lore/LoreLanguageSwitcher";
import { getLoreIndex, getLorePlainText } from "@/lib/lore/loreContent";
import type { LoreLanguageCode } from "@/lib/lore/loreLanguages";

export const metadata: Metadata = {
  title: "The Melting Land Universe",
  description:
    "If you out there can survive, survive your life! Help each other no matter the conditions. Be prepared for anything. Our journey has just begun. — Prof. NOTA v10.0",
};

type LorePageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

const BACK_TO_HOME_LABELS: Record<LoreLanguageCode, string> = {
  de: "← Zurück zur Startseite",
  en: "← Back to Home",
  id: "← Kembali ke Beranda",
};

const CHAPTER_LABELS: Record<LoreLanguageCode, string> = {
  de: "Kapitel",
  en: "Chapter",
  id: "Babak",
};

const AUTHOR_NOTES: Record<
  LoreLanguageCode,
  {
    eyebrow: string;
    message: string;
    suffix: string;
    title: string;
  }
> = {
  de: {
    eyebrow: "Notizen von Prof. NOTA v11.47",
    message: "Sende deine Gedanken an diese E-Mail",
    suffix: ", OiOi!",
    title: "Also, was denkst du...",
  },
  en: {
    eyebrow: "Notes from Prof. NOTA v11.47",
    message: "Send your thoughts to this email",
    suffix: ", OiOi!",
    title: "So, what do you think...",
  },
  id: {
    eyebrow: "Catatan dari Prof. NOTA v11.47",
    message: "Kirimkan pikiranmu ke email ini",
    suffix: ", OiOi!",
    title: "Jadi, bagaimana menurutmu...",
  },
};

export default async function LorePage({ searchParams }: LorePageProps) {
  const { lang } = await searchParams;
  const lore = await getLoreIndex(lang);
  const authorNotes = AUTHOR_NOTES[lore.language];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <Link className="text-sm text-white/70 underline" href="/">
            {BACK_TO_HOME_LABELS[lore.language]}
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/70">
            {getLorePlainText(lore.title)}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {getLorePlainText(lore.title)}
          </h1>
          <p className="mt-4 max-w-3xl text-white/70">
            {getLorePlainText(lore.intro)}
          </p>
        </div>
        <div className="mt-6">
          <LoreLanguageSwitcher currentLanguage={lore.language} />
        </div>
      </header>

      {lore.surfaces.flatMap((surface, surfaceIndex) =>
        surface.sections.map((section, sectionIndex) => (
          <section
            className="grid gap-5 scroll-mt-30"
            id={`lore-surface-${surfaceIndex + 1}-${sectionIndex + 1}`}
            key={`${surface.title}-${section.title}`}>
            <section className="rounded-3xl border border-white/10 bg-black p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-white/70">
                {getLorePlainText(surface.title)}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {getLorePlainText(section.title)}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {getLorePlainText(section.description)}
              </p>
            </section>

            {section.chapters.map((chapter) => (
              <article
                className="min-w-0 rounded-3xl border border-white/10 bg-black p-6"
                key={chapter.slug}>
                <p className="text-sm uppercase tracking-[0.25em] text-white/70">
                  {CHAPTER_LABELS[lore.language]} 0{String(surfaceIndex + 1)}.
                  {String(chapter.chapterNumber).padStart(2, "0")}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2 md:items-stretch">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/70 text-black">
                    <Link
                      className="block h-full bg-(--oioi-accent) transition hover:bg-black"
                      href={`/lore/chapter/${chapter.slug}?lang=${lore.language}`}>
                      <Image
                        alt={`${getLorePlainText(chapter.title)} lore artwork`}
                        className="aspect-2/1 w-full object-cover md:aspect-auto md:h-full"
                        height={1280}
                        priority={
                          surfaceIndex === 0 && chapter.chapterNumber === 1
                        }
                        src="/lore/og-image.gif"
                        unoptimized
                        width={2560}
                      />
                    </Link>
                  </div>

                  <div className="rounded-2xl p-4 flex flex-col justify-center">
                    <Link
                      className="transition hover:underline underline-offset-4"
                      href={`/lore/chapter/${chapter.slug}?lang=${lore.language}`}>
                      <h3 className="text-3xl font-semibold text-white">
                        {getLorePlainText(chapter.title)}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm leading-7 text-white/70">
                      {chapter.excerpt}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )),
      )}

      <section className="grid gap-5 scroll-mt-30">
        <section className="rounded-3xl border border-white/10 bg-black p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">
            {authorNotes.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{authorNotes.title}</h2>
          <p className="mt-2 text-sm text-white/70">
            {authorNotes.message}{" "}
            <Link
              href="mailto:nota@endhonesa.com"
              className="text-white transition hover:text-(--oioi-accent)">
              nota@endhonesa.com
            </Link>
            {authorNotes.suffix}
          </p>
        </section>
      </section>
    </main>
  );
}
