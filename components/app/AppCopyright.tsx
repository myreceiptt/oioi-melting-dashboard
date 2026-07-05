"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function formatTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}/${month}/${day}, ${hour}:${minute}:${second}`;
}

export function AppCopyright() {
  const [label, setLabel] = useState<"Copyright" | "Copyleft">("Copyright");
  const [timestamp, setTimestamp] = useState("----/--/--, --:--:--");
  const [company, setCompany] = useState<"Prof. NOTA Inc." | "ENDHONESA.COM">(
    "Prof. NOTA Inc.",
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function updateTimestamp() {
      setTimestamp(formatTimestamp(new Date()));
    }

    updateTimestamp();
    const intervalId = window.setInterval(updateTimestamp, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <>
      <div className="flex min-w-0 flex-wrap gap-1 items-center rounded-2xl border border-white/10 bg-black p-1 text-sm font-semibold text-white">
        <button
          className="hidden cursor-pointer rounded-xl bg-black py-2 px-3 text-white hover:bg-(--oioi-accent) sm:block"
          onClick={() =>
            setLabel((current) =>
              current === "Copyright" ? "Copyleft" : "Copyright",
            )
          }
          type="button">
          {label}
        </button>
        <span className="hidden py-2 px-3 text-white/70 sm:block">
          {timestamp}
        </span>
        <button
          aria-label="Open Prof. NOTA Inc. icon"
          className="cursor-pointer rounded-xl bg-black py-2 px-3 hover:bg-(--oioi-accent)"
          onClick={() => setModalOpen(true)}
          type="button">
          <Image
            alt="Prof. NOTA Inc."
            className="h-5 w-5 rounded-full"
            height={24}
            src="/shortcut-icon.png"
            width={24}
          />
        </button>
        <button
          className="hidden cursor-pointer rounded-xl bg-black py-2 px-3 text-white hover:bg-(--oioi-accent) sm:block"
          onClick={() =>
            setCompany((current) =>
              current === "Prof. NOTA Inc."
                ? "ENDHONESA.COM"
                : "Prof. NOTA Inc.",
            )
          }
          type="button">
          {company}
        </button>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-3xl border border-white/10 bg-black p-5 text-center text-white shadow-2xl">
            <div className="flex justify-end">
              <div className="rounded-2xl border border-white/10 bg-black p-1">
                <button
                  className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent)"
                  onClick={() => setModalOpen(false)}
                  type="button">
                  Close
                </button>
              </div>
            </div>

            <div className="mx-auto mt-3 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/30 p-2">
              <Image
                alt="Prof. NOTA Inc."
                className="h-full w-full rounded-full object-cover"
                height={160}
                priority
                src="/shortcut-icon.png"
                width={160}
              />
            </div>

            <div className="mt-5 grid gap-2 text-sm font-semibold">
              <button
                className="cursor-pointer rounded-xl bg-black px-4 py-2 text-white hover:bg-(--oioi-accent)"
                onClick={() =>
                  setLabel((current) =>
                    current === "Copyright" ? "Copyleft" : "Copyright",
                  )
                }
                type="button">
                {label}
              </button>
              <div className="rounded-xl bg-black px-4 py-2 text-white/70">
                {timestamp}
              </div>
              <a
                className="rounded-xl bg-black px-4 py-2 text-white hover:bg-(--oioi-accent)"
                href="https://nota.endhonesa.com/"
                rel="noreferrer"
                target="_blank">
                Prof. NOTA Inc.
              </a>
              <a
                className="rounded-xl bg-black px-4 py-2 text-white hover:bg-(--oioi-accent)"
                href="https://endhonesa.com"
                rel="noreferrer"
                target="_blank">
                ENDHONESA.COM
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
