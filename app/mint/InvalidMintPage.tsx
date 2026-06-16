import Link from "next/link";

export function InvalidMintPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">
            NFT Mint Page
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Invalid mint page</h1>
          <p className="mt-4 max-w-3xl text-white/70">
            You typed something wrong! Please double-check the URL you try to
            visit!
          </p>
          <div className="mt-6 ">
            <Link
              className="rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-(--oioi-accent) hover:text-white cursor-pointer"
              href="https://softstaking.endhonesa.com/">
              Go to OiOi Melting Dashboard
            </Link>
          </div>
        </div>
      </header>
    </main>
  );
}
