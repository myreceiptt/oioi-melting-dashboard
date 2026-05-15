import type { Metadata } from "next";
import "./globals.css";
import { Web3Providers } from "@/lib/wallet/Web3Providers";

export const metadata: Metadata = {
  title: "OiOi Melting Dashboard",
  description:
    "Wallet-first minting, soft staking, and $OiOi reward dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
