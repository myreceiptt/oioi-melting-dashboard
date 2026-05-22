import type { Metadata } from "next";
import "./globals.css";
import { Web3Providers } from "@/lib/wallet/Web3Providers";
import { AppEnvironmentBanner } from "@/components/app/AppEnvironmentBanner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  // 1. Base URL configuration (Required for absolute canonical and OG image paths)
  metadataBase: new URL("https://softstaking.endhonesa.com"),

  // 2. Search Engine Optimization
  title: {
    default: "OiOi Melting Dashboard",
    template: "%s | OiOi Melting Dashboard", // Appends site name to child page titles
  },
  description:
    "Use only your Web3 wallet (EOA) to mint, stake, unstake, and claim rewards. Your key, your asset, OiOi!",
  keywords: [
    "The ROTY BROI Polygon NFT",
    "ROTY BASE NFT",
    "ROTY dETH Ethereum NFT",
    "The Melting Land NFTs",
    "Melting BASE NFT",
    "Melting dETH Ethereum NFT",
    "Amanda Wives NFTs",
    "Amanda BASE NFT",
    "Amanda dETH Ethereum NFT",
    "NFT Soft Staking",
    "OiOi Ethereum Token",
    "OiOi Reward Distribution",
    "ENDHONESA",
    "Prof. NOTA",
    "Prof. NOTA Inc.",
    "0101 Universe",
  ],
  authors: [{ name: "Prof. NOTA", url: "https://nota.endhonesa.com" }],
  creator: "Prof. NOTA v11.47",
  publisher: "Prof. NOTA Inc.",

  // 3. Crawler Control (Robots)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // 4. Open Graph (Facebook, LinkedIn, Discord)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://softstaking.endhonesa.com",
    title: "OiOi Melting Dashboard",
    description:
      "Use only your Web3 wallet (EOA) to mint, stake, unstake, and claim rewards. Your key, your asset, OiOi!",
    siteName: "OiOi Melting Dashboard",
    images: [
      {
        url: "/og-image.gif", // Placed in public/og-image.gif
        width: 2560,
        height: 1280,
        alt: "The Melting Land on Earth 4.0",
      },
    ],
  },

  // 5. X / Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "OiOi Melting Dashboard",
    description:
      "Use only your Web3 wallet (EOA) to mint, stake, unstake, and claim rewards. Your key, your asset, OiOi!",
    site: "@MyReceiptTT",
    creator: "@MyReceiptTT",
    images: ["/og-image.gif"],
  },

  // 6. Verification Tools (Webmaster)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  //   yahoo: "your-yahoo-verification-code",
  // },

  // 7. Core Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/shortcut-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Providers>
          <AppEnvironmentBanner />
          {children}
        </Web3Providers>
        <Analytics />
      </body>
    </html>
  );
}
