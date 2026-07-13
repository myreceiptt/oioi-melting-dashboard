import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  LORE_LANGUAGES,
  type LoreLanguageCode,
} from "@/lib/lore/loreLanguages";

export type LoreChapter = {
  body: string;
  chapterNumber: number;
  excerpt: string;
  sectionTitle: string;
  slug: string;
  surfaceTitle: string;
  title: string;
};

export type LoreSection = {
  chapters: LoreChapter[];
  description: string;
  title: string;
};

export type LoreSurface = {
  sections: LoreSection[];
  title: string;
};

export type LoreDocument = {
  intro: string;
  language: LoreLanguageCode;
  surfaces: LoreSurface[];
  title: string;
};

const DEFAULT_LORE_LANGUAGE: LoreLanguageCode = "en";
const LORE_EXCERPT_LENGTH = 474;

function getLoreLanguage(code: LoreLanguageCode) {
  return LORE_LANGUAGES.find((language) => language.code === code);
}

export function normalizeLoreLanguage(
  value: string | string[] | null | undefined,
): LoreLanguageCode {
  const candidate = Array.isArray(value) ? value[0] : value;

  return LORE_LANGUAGES.some((language) => language.code === candidate)
    ? (candidate as LoreLanguageCode)
    : DEFAULT_LORE_LANGUAGE;
}

async function readLoreMarkdown(language: LoreLanguageCode) {
  const languageConfig = getLoreLanguage(language) ?? getLoreLanguage("en");
  const lorePath = path.join(
    process.cwd(),
    "LORE",
    languageConfig?.fileName ?? "LORE.en.md",
  );

  try {
    return await readFile(lorePath, "utf8");
  } catch {
    return readFile(path.join(process.cwd(), "LORE", "LORE.en.md"), "utf8");
  }
}

export function getLorePlainText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function slugify(value: string) {
  return (
    getLorePlainText(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "chapter"
  );
}

function makeExcerpt(markdown: string) {
  const plainText = markdown
    .split("\n")
    .map((line) =>
      getLorePlainText(
        line
          .replace(/^>\s?/, "")
          .replace(/^[-*]\s+/, "")
          .replace(/\\$/, ""),
      ),
    )
    .filter((line) => line && line !== "---")
    .join("\n\n");

  if (!plainText) {
    return "Open this chapter to read the lore archive.";
  }

  if (plainText.length <= LORE_EXCERPT_LENGTH) {
    return plainText;
  }

  const excerptStart = plainText.length - LORE_EXCERPT_LENGTH;
  const rawExcerpt = plainText.slice(excerptStart);
  const firstWhitespaceIndex = rawExcerpt.search(/\s/);
  const excerpt =
    firstWhitespaceIndex > -1
      ? rawExcerpt.slice(firstWhitespaceIndex).trim()
      : rawExcerpt.trim();

  return `...${excerpt}`;
}

function readHeading(line: string, level: 1 | 2 | 3 | 4) {
  const prefix = `${"#".repeat(level)} `;

  return line.startsWith(prefix) ? line.slice(prefix.length).trim() : null;
}

function parseLoreMarkdown(
  markdown: string,
  language: LoreLanguageCode,
): LoreDocument {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const title = readHeading(
    lines.find((line) => line.startsWith("# ")) ?? "",
    1,
  );
  const introLines: string[] = [];
  let hasPassedTitle = false;
  const surfaces: LoreSurface[] = [];
  let currentSurface: LoreSurface | null = null;
  let currentSection: LoreSection | null = null;
  let currentChapter: LoreChapter | null = null;
  let currentChapterLines: string[] = [];
  let currentSectionDescriptionLines: string[] = [];

  function commitSectionDescription() {
    if (!currentSection) {
      return;
    }

    const description = currentSectionDescriptionLines.join("\n").trim();
    if (description) {
      currentSection.description = description;
    }
    currentSectionDescriptionLines = [];
  }

  function commitChapter() {
    if (!currentChapter) {
      return;
    }

    const body = currentChapterLines.join("\n").trim();
    currentChapter.body = body;
    currentChapter.excerpt = makeExcerpt(body);
    currentChapter = null;
    currentChapterLines = [];
  }

  for (const line of lines) {
    if (!hasPassedTitle) {
      if (readHeading(line, 1)) {
        hasPassedTitle = true;
      }
      continue;
    }

    const surfaceTitle = readHeading(line, 2);
    if (surfaceTitle) {
      commitChapter();
      commitSectionDescription();
      currentSurface = {
        sections: [],
        title: surfaceTitle,
      };
      surfaces.push(currentSurface);
      currentSection = null;
      continue;
    }

    if (!currentSurface) {
      introLines.push(line);
      continue;
    }

    const sectionTitle = readHeading(line, 3);
    if (sectionTitle) {
      commitChapter();
      commitSectionDescription();
      if (!currentSurface) {
        currentSurface = {
          sections: [],
          title: "Lore Surface",
        };
        surfaces.push(currentSurface);
      }
      currentSection = {
        chapters: [],
        description: "",
        title: sectionTitle,
      };
      currentSurface.sections.push(currentSection);
      continue;
    }

    const chapterTitle = readHeading(line, 4);
    if (chapterTitle) {
      commitChapter();
      commitSectionDescription();
      if (!currentSurface) {
        currentSurface = {
          sections: [],
          title: "Lore Surface",
        };
        surfaces.push(currentSurface);
      }
      if (!currentSection) {
        currentSection = {
          chapters: [],
          description: "",
          title: "Lore Section",
        };
        currentSurface.sections.push(currentSection);
      }

      currentChapter = {
        body: "",
        chapterNumber: currentSection.chapters.length + 1,
        excerpt: "",
        sectionTitle: currentSection.title,
        slug: slugify(chapterTitle),
        surfaceTitle: currentSurface.title,
        title: chapterTitle,
      };
      currentSection.chapters.push(currentChapter);
      continue;
    }

    if (currentChapter) {
      currentChapterLines.push(line);
    } else if (currentSection) {
      currentSectionDescriptionLines.push(line);
    }
  }

  commitChapter();
  commitSectionDescription();

  return {
    intro:
      introLines
        .join("\n")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .find(Boolean) ??
      "A chapter archive for The ROTY BROI, BANANOW Land, The ROTY BASE dETH memorial, The Melting Land, Amanda Wives, and everything that follows.",
    language,
    surfaces,
    title: title ?? "The Melting Land Universe",
  };
}

function getChapters(document: LoreDocument) {
  return document.surfaces.flatMap((surface) =>
    surface.sections.flatMap((section) => section.chapters),
  );
}

function applyCanonicalSlugs(
  document: LoreDocument,
  canonicalDocument: LoreDocument,
) {
  const chapters = getChapters(document);
  const canonicalChapters = getChapters(canonicalDocument);
  const usedSlugs = new Set<string>();

  chapters.forEach((chapter, index) => {
    const canonicalSlug = canonicalChapters[index]?.slug ?? chapter.slug;
    let slug = canonicalSlug;
    let duplicateIndex = 2;

    while (usedSlugs.has(slug)) {
      slug = `${canonicalSlug}-${duplicateIndex}`;
      duplicateIndex += 1;
    }

    usedSlugs.add(slug);
    chapter.slug = slug;
  });
}

export async function getLoreIndex(
  languageInput: string | string[] | null | undefined,
) {
  const language = normalizeLoreLanguage(languageInput);
  const [canonicalMarkdown, selectedMarkdown] = await Promise.all([
    readLoreMarkdown("en"),
    readLoreMarkdown(language),
  ]);
  const canonicalDocument = parseLoreMarkdown(canonicalMarkdown, "en");
  const selectedDocument =
    language === "en"
      ? canonicalDocument
      : parseLoreMarkdown(selectedMarkdown, language);

  applyCanonicalSlugs(selectedDocument, canonicalDocument);

  return selectedDocument;
}

export async function getLoreChapter(
  slug: string,
  languageInput: string | string[] | null | undefined,
) {
  const document = await getLoreIndex(languageInput);
  const chapter = getChapters(document).find((item) => item.slug === slug);

  return chapter
    ? {
        chapter,
        document,
      }
    : null;
}
