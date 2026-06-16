import Link from "next/link";

type InvalidPageProps = {
  eyebrow: string;
  title: string;
  message: string;
  href: string;
  actionLabel: string;
};

export function InvalidPage({
  eyebrow,
  title,
  message,
  href,
  actionLabel,
}: InvalidPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
          <p className="mt-4 max-w-3xl text-white/70">{message}</p>
          <div className="mt-6">
            <Link
              className="inline-block cursor-pointer rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-(--oioi-accent) hover:text-white"
              href={href}>
              {actionLabel}
            </Link>
          </div>
        </div>
      </header>
    </main>
  );
}
