import type { Metadata } from "next";

const loreSections = [
  {
    eyebrow: "Chapter 01",
    title: "The ROTY BROI Ark",
    body: "This section is reserved for the opening story of The ROTY BROI ark, the vessel, the first invitation, and the beginning of the survival route through The Melting Land Universe.",
    imageAlt: "Placeholder for The ROTY BROI ark lore artwork",
  },
  {
    eyebrow: "Chapter 02",
    title: "BANANOW Land",
    body: "This section is reserved for the story of BANANOW Land, the land discovered after the voyage, and the early signs that the universe was wider than the wreckage left behind.",
    imageAlt: "Placeholder for BANANOW Land lore artwork",
  },
  {
    eyebrow: "Chapter 03",
    title: "The ROTY BASE dETH Memorial",
    body: "This section is reserved for the monument built from the remains of The ROTY BROI ark, where memory, chain, and survival become part of the same memorial surface.",
    imageAlt: "Placeholder for The ROTY BASE dETH memorial artwork",
  },
  {
    eyebrow: "Chapter 04",
    title: "The Melting Land",
    body: "This section is reserved for the wider story of The Melting Land itself, the condition of the world, the people who remain, and the collections that carry the memory forward.",
    imageAlt: "Placeholder for The Melting Land lore artwork",
  },
];

export const metadata: Metadata = {
  title: "Lore",
  description:
    "The Melting Land Universe lore archive for The ROTY BROI, BANANOW Land, ROTY BASE dETH, The Melting Land, and Amanda Wives.",
};

export default function LorePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">
          The Melting Land Universe
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Lore Archive</h1>
        <p className="mt-4 max-w-3xl text-white/70">
          A reserved story surface for the full lore sequence of The ROTY BROI,
          BANANOW Land, The ROTY BASE dETH memorial, The Melting Land, Amanda
          Wives, and everything that follows.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              Draft Surface
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Content will be inserted here later.
            </h2>
          </div>
          <p className="text-sm leading-7 text-white/70">
            Place your final `.md` text and artwork files in the repo when they
            are ready. This page is intentionally structured as a clean
            editorial shell first, so the final lore can be dropped in without
            changing the app navigation or page route again.
          </p>
        </div>
      </section>

      <section className="grid gap-6">
        {loreSections.map((section) => (
          <article
            className="rounded-3xl border border-white/10 bg-black p-6"
            key={section.title}
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch">
              <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/70 p-6 text-center text-black">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-black/60">
                    Image Placeholder
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {section.imageAlt}
                  </p>
                  <p className="mt-2 text-sm text-black/70">
                    Replace this block with a PNG, SVG, GIF, video, or embedded
                    scene when the final asset is ready.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                  {section.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold">{section.title}</h2>
                <p className="mt-4 text-sm leading-7 text-white/70">
                  {section.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">
          Author Notes
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Markdown Ready</h2>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm leading-7 text-black/70">
          When your lore text is ready, this section can become a rendered
          markdown area, a chapter index, or a source note block for Prof. NOTA
          Inc. and ENDHONESA.COM.
        </div>
      </section>
    </main>
  );
}
