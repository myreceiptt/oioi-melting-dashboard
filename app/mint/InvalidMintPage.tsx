import Link from "next/link";

export function InvalidMintPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <h1 className="text-3xl font-semibold">Invalid mint page</h1>
        <Link
          className="mt-4 inline-block underline"
          href="https://softstaking.endhonesa.com/">
          Go to OiOi Melting Dashboard
        </Link>
      </section>
    </main>
  );
}
