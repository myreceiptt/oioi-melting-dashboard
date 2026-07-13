import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type LoreMarkdownProps = {
  content: string;
};

export function LoreMarkdown({ content }: LoreMarkdownProps) {
  return (
    <ReactMarkdown
      components={{
        a: ({ children, href }) => (
          <a
            className="font-semibold underline decoration-white/40 underline-offset-4 hover:text-(--oioi-accent)"
            href={href}
            rel="noreferrer"
            target="_blank">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="rounded-3xl bg-black text-white [&_a]:text-white [&_p]:text-white/80 [&_strong]:text-white">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded-lg bg-black px-2 py-1 text-sm text-white">
            {children}
          </code>
        ),
        em: ({ children }) => <em className="text-white/80">{children}</em>,
        h1: ({ children }) => (
          <h1 className="mt-10 text-4xl font-semibold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-10 text-3xl font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-8 text-2xl font-semibold">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mt-8 text-xl font-semibold">{children}</h4>
        ),
        hr: () => <hr className="my-8 border-white/10" />,
        img: ({ alt, src }) =>
          typeof src === "string" ? (
            <span className="relative my-6 block aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
              <Image
                alt={alt ?? ""}
                className="object-contain"
                fill
                sizes="(max-width: 768px) 100vw, 960px"
                src={src}
              />
            </span>
          ) : null,
        li: ({ children }) => <li className="mt-2 pl-1">{children}</li>,
        ol: ({ children }) => (
          <ol className="my-5 list-decimal space-y-2 pl-6 text-white/80">
            {children}
          </ol>
        ),
        p: ({ children }) => (
          <p className="my-4 leading-7 text-white/80">{children}</p>
        ),
        pre: ({ children }) => (
          <pre className="my-5 overflow-x-auto rounded-2xl bg-black p-4 text-sm text-white">
            {children}
          </pre>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="my-5 list-disc space-y-2 pl-6 text-white/80">
            {children}
          </ul>
        ),
      }}
      remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
