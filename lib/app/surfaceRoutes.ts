export type MintCollection = "roty" | "melting" | "amanda";
export type SurfaceChain = "base" | "ethereum";

export type MintSurface = {
  collection: MintCollection;
  chain: SurfaceChain;
  host: string;
  origin: string;
  pathname: string;
  label: string;
};

export const MAIN_APP_HOST = "softstaking.endhonesa.com";
export const MAIN_APP_ORIGIN = `https://${MAIN_APP_HOST}`;

export const MINT_SURFACES = [
  {
    collection: "roty",
    chain: "base",
    host: "rotybase.endhonesa.com",
    origin: "https://rotybase.endhonesa.com",
    pathname: "/mint/roty/base",
    label: "ROTY BASE Mint",
  },
  {
    collection: "roty",
    chain: "ethereum",
    host: "rotydeth.endhonesa.com",
    origin: "https://rotydeth.endhonesa.com",
    pathname: "/mint/roty/ethereum",
    label: "ROTY dETH Mint",
  },
  {
    collection: "melting",
    chain: "base",
    host: "meltingbase.endhonesa.com",
    origin: "https://meltingbase.endhonesa.com",
    pathname: "/mint/melting/base",
    label: "Melting BASE Mint",
  },
  {
    collection: "melting",
    chain: "ethereum",
    host: "meltingdeth.endhonesa.com",
    origin: "https://meltingdeth.endhonesa.com",
    pathname: "/mint/melting/ethereum",
    label: "Melting dETH Mint",
  },
  {
    collection: "amanda",
    chain: "base",
    host: "amandabase.endhonesa.com",
    origin: "https://amandabase.endhonesa.com",
    pathname: "/mint/amanda/base",
    label: "Amanda BASE Mint",
  },
  {
    collection: "amanda",
    chain: "ethereum",
    host: "amandadeth.endhonesa.com",
    origin: "https://amandadeth.endhonesa.com",
    pathname: "/mint/amanda/ethereum",
    label: "Amanda dETH Mint",
  },
] as const satisfies readonly MintSurface[];

export function normalizeHost(host: string | null | undefined) {
  if (!host) {
    return "";
  }

  return host
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/:\d+$/, "");
}

export function getMintSurfaceByHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return (
    MINT_SURFACES.find((surface) => surface.host === normalizedHost) ?? null
  );
}

export function isDedicatedMintHost(host: string | null | undefined) {
  return getMintSurfaceByHost(host) !== null;
}

export function getEffectivePathname(
  host: string | null | undefined,
  pathname: string,
) {
  const mintSurface = getMintSurfaceByHost(host);

  if (mintSurface && pathname === "/") {
    return mintSurface.pathname;
  }

  return pathname;
}

export function getMainAppHref(pathname = "") {
  return `${MAIN_APP_ORIGIN}${pathname}`;
}

export function getMintSurfaceHref(surface: MintSurface, pathname = "/") {
  return `${surface.origin}${pathname === "/" ? "/" : pathname}`;
}
