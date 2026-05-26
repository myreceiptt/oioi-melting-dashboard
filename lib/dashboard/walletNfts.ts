import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  type Address,
} from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getChainForSet } from "@/lib/chains/chainConfig";
import {
  type CollectionConfig,
  type CollectionKey,
  getChainCollections,
} from "@/lib/contracts/collectionConfig";
import { erc721SharedAbi, stakingAbi } from "@/lib/contracts/abis";
import { getAppEnv, getRequiredEnv } from "@/lib/utils/env";
import { sameAddress } from "@/lib/utils/address";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_MEDIA_URL = "/artifact.gif";
const TRANSFER_PAGE_LIMIT = 3;
const ALCHEMY_MAX_COUNT = "0x3e8";

type ChainKey =
  | "baseSepolia"
  | "ethereumSepolia"
  | "baseMainnet"
  | "ethereumMainnet";
type MediaType = "image" | "video" | "audio" | "html" | "unknown";

type DashboardCacheRow = {
  chain_key: ChainKey;
  wallet_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string | number;
  owner_address: string | null;
  wallet_owns_token: boolean;
  collection_approved: boolean | null;
  stake_exists: boolean;
  stake_active: boolean;
  stake_valid: boolean;
  can_stake: boolean;
  can_unstake: boolean;
  staked_at_unix: string | number | null;
  unstaked_at_unix: string | number | null;
  token_uri: string | null;
  metadata_uri: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  animation_url: string | null;
  media_type: MediaType;
  thumbnail_url: string | null;
  raw_metadata: Record<string, unknown> | null;
  source: Record<string, unknown>;
  last_fetched_at: string;
};

export type DashboardWalletNft = {
  chainKey: ChainKey;
  walletAddress: Address;
  collectionKey: CollectionKey;
  collectionName: string;
  collectionSymbol: string;
  collectionAddress: Address;
  tokenId: string;
  ownerAddress: Address | null;
  walletOwnsToken: boolean;
  collectionApproved: boolean | null;
  stakeExists: boolean;
  stakeActive: boolean;
  stakeValid: boolean;
  canStake: boolean;
  canUnstake: boolean;
  stakedAtUnix: string | null;
  unstakedAtUnix: string | null;
  tokenUri: string | null;
  metadataUri: string | null;
  media: {
    assetType: MediaType;
    assetUrl: string;
    imageUrl: string;
    animationUrl: string | null;
    thumbnailUrl: string;
  };
  metadata: {
    name: string;
    description: string | null;
  };
  source: Record<string, unknown>;
  fetchedAt: string;
};

type AlchemyNft = {
  contract?: { address?: string };
  tokenId?: string;
  tokenType?: string;
  name?: string;
  description?: string;
  tokenUri?: string | { raw?: string; gateway?: string };
  tokenUriRaw?: string;
  image?: {
    cachedUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
    originalUrl?: string;
  };
  raw?: {
    tokenUri?: string;
    metadata?: Record<string, unknown> | null;
  };
};

type AlchemyTransfer = {
  rawContract?: {
    address?: string;
    value?: string;
  };
  erc721TokenId?: string;
  tokenId?: string;
};

type StakePosition = {
  exists: boolean;
  active: boolean;
  stakedAt: bigint;
  unstakedAt: bigint;
};

function getChainKey(chainSet: ChainSet): ChainKey {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base" ? "baseMainnet" : "ethereumMainnet";
  }

  return chainSet === "base" ? "baseSepolia" : "ethereumSepolia";
}

function getAlchemyNetwork(chainSet: ChainSet) {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base" ? "base-mainnet" : "eth-mainnet";
  }

  return chainSet === "base" ? "base-sepolia" : "eth-sepolia";
}

function getAlchemyRpcUrl(chainSet: ChainSet) {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base"
      ? process.env.ALCHEMY_BASE_MAINNET_RPC_URL || process.env.BASE_RPC_URL
      : process.env.ALCHEMY_ETHEREUM_MAINNET_RPC_URL ||
          process.env.ETHEREUM_RPC_URL;
  }

  return chainSet === "base"
    ? process.env.ALCHEMY_BASE_SEPOLIA_RPC_URL ||
        process.env.BASE_SEPOLIA_RPC_URL
    : process.env.ALCHEMY_ETHEREUM_SEPOLIA_RPC_URL ||
        process.env.ETHEREUM_SEPOLIA_RPC_URL;
}

function getViemChain(chainSet: ChainSet) {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base" ? base : mainnet;
  }

  return chainSet === "base" ? baseSepolia : sepolia;
}

function createDashboardPublicClient(chainSet: ChainSet) {
  const rpcUrl = getAlchemyRpcUrl(chainSet);

  if (!rpcUrl) {
    throw new Error(`Missing Alchemy RPC URL for dashboard ${chainSet}.`);
  }

  return createPublicClient({
    chain: getViemChain(chainSet),
    transport: http(rpcUrl),
  });
}

function normalizeAddress(value: string) {
  return getAddress(value);
}

function normalizeIpfsUri(uri: string | null | undefined) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("ipfs://")) {
    const path = uri.slice("ipfs://".length).replace(/^ipfs\//, "");
    return `https://ipfs.io/ipfs/${path}`;
  }

  return uri;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function detectMediaType(
  url: string | null,
  preferredUnknown: MediaType = "unknown",
): MediaType {
  if (!url) {
    return "unknown";
  }

  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";

  if (/\.(mp4|webm|mov|m4v)$/.test(cleanUrl)) {
    return "video";
  }

  if (/\.(mp3|wav|ogg|flac|m4a)$/.test(cleanUrl)) {
    return "audio";
  }

  if (/\.(html|htm)$/.test(cleanUrl)) {
    return "html";
  }

  if (/\.(gif|png|jpg|jpeg|webp|avif|svg)$/.test(cleanUrl)) {
    return "image";
  }

  return preferredUnknown;
}

function decimalTokenId(value: string | number | bigint | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0
      ? Math.trunc(value).toString()
      : null;
  }

  if (typeof value === "bigint") {
    return value >= 0n ? value.toString() : null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  try {
    return BigInt(trimmed).toString();
  } catch {
    return null;
  }
}

function tokenIdFromAlchemyNft(nft: AlchemyNft) {
  return decimalTokenId(nft.tokenId);
}

function tokenIdFromTransfer(transfer: AlchemyTransfer) {
  return (
    decimalTokenId(transfer.erc721TokenId) ??
    decimalTokenId(transfer.tokenId) ??
    decimalTokenId(transfer.rawContract?.value)
  );
}

function sameContract(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function getNftTokenUri(nft?: AlchemyNft) {
  if (!nft) {
    return null;
  }

  if (typeof nft.tokenUri === "string") {
    return nft.tokenUri;
  }

  return (
    readString(nft.tokenUri?.raw) ??
    readString(nft.tokenUri?.gateway) ??
    readString(nft.tokenUriRaw) ??
    readString(nft.raw?.tokenUri)
  );
}

function getRawMetadataValue(
  rawMetadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  if (!rawMetadata) {
    return null;
  }

  return readString(rawMetadata[key]);
}

function buildAlchemyNftUrl({
  chainSet,
  path,
}: {
  chainSet: ChainSet;
  path: string;
}) {
  const apiKey = getRequiredEnv("ALCHEMY_API_KEY");
  return `https://${getAlchemyNetwork(chainSet)}.g.alchemy.com/nft/v3/${apiKey}/${path}`;
}

function buildAlchemyRpcUrl(chainSet: ChainSet) {
  const rpcUrl = getAlchemyRpcUrl(chainSet);

  if (rpcUrl) {
    return rpcUrl;
  }

  const apiKey = getRequiredEnv("ALCHEMY_API_KEY");
  return `https://${getAlchemyNetwork(chainSet)}.g.alchemy.com/v2/${apiKey}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Alchemy request failed ${response.status}: ${body || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

async function fetchOwnedNfts({
  chainSet,
  walletAddress,
  collections,
}: {
  chainSet: ChainSet;
  walletAddress: Address;
  collections: CollectionConfig[];
}) {
  const contractAddresses = collections.map(
    (collection) => collection.contractAddress,
  );
  const ownedNfts: AlchemyNft[] = [];
  let pageKey: string | undefined;

  do {
    const url = new URL(
      buildAlchemyNftUrl({
        chainSet,
        path: "getNFTsForOwner",
      }),
    );

    url.searchParams.set("owner", walletAddress);
    url.searchParams.set("withMetadata", "true");
    url.searchParams.set("pageSize", "100");

    for (const contractAddress of contractAddresses) {
      url.searchParams.append("contractAddresses[]", contractAddress);
    }

    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const data = await fetchJson<{
      ownedNfts?: AlchemyNft[];
      pageKey?: string;
    }>(url.toString());
    ownedNfts.push(...(data.ownedNfts ?? []));
    pageKey = data.pageKey;
  } while (pageKey);

  return ownedNfts;
}

async function fetchTransfersPage({
  chainSet,
  walletAddress,
  contractAddresses,
  direction,
  pageKey,
}: {
  chainSet: ChainSet;
  walletAddress: Address;
  contractAddresses: Address[];
  direction: "from" | "to";
  pageKey?: string;
}) {
  const params: Record<string, unknown> = {
    fromBlock: "0x0",
    category: ["erc721"],
    contractAddresses,
    withMetadata: false,
    excludeZeroValue: false,
    maxCount: ALCHEMY_MAX_COUNT,
  };

  if (direction === "from") {
    params.fromAddress = walletAddress;
  } else {
    params.toAddress = walletAddress;
  }

  if (pageKey) {
    params.pageKey = pageKey;
  }

  const data = await fetchJson<{
    result?: {
      transfers?: AlchemyTransfer[];
      pageKey?: string;
    };
  }>(buildAlchemyRpcUrl(chainSet), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [params],
    }),
  });

  return {
    transfers: data.result?.transfers ?? [],
    pageKey: data.result?.pageKey,
  };
}

async function fetchHistoricalTokenIds({
  chainSet,
  walletAddress,
  collections,
}: {
  chainSet: ChainSet;
  walletAddress: Address;
  collections: CollectionConfig[];
}) {
  const contractAddresses = collections.map(
    (collection) => collection.contractAddress,
  );
  const byCollection = new Map<CollectionKey, Set<string>>();

  for (const collection of collections) {
    byCollection.set(collection.collectionKey, new Set());
  }

  for (const direction of ["to", "from"] as const) {
    let pageKey: string | undefined;

    for (let page = 0; page < TRANSFER_PAGE_LIMIT; page++) {
      const result = await fetchTransfersPage({
        chainSet,
        walletAddress,
        contractAddresses,
        direction,
        pageKey,
      });

      for (const transfer of result.transfers) {
        const transferAddress = transfer.rawContract?.address;
        const tokenId = tokenIdFromTransfer(transfer);

        if (!transferAddress || !tokenId) {
          continue;
        }

        const collection = collections.find((item) =>
          sameContract(item.contractAddress, transferAddress),
        );

        if (!collection) {
          continue;
        }

        byCollection.get(collection.collectionKey)?.add(tokenId);
      }

      if (!result.pageKey) {
        break;
      }

      pageKey = result.pageKey;
    }
  }

  return byCollection;
}

async function fetchTokenMetadataFromUri(tokenUri: string | null) {
  const metadataUrl = normalizeIpfsUri(tokenUri);

  if (!metadataUrl) {
    return null;
  }

  try {
    const response = await fetch(metadataUrl, {
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildMediaFields({
  nft,
  metadata,
}: {
  nft?: AlchemyNft;
  metadata: Record<string, unknown> | null;
}) {
  const imageUrl =
    readString(nft?.image?.cachedUrl) ??
    readString(nft?.image?.pngUrl) ??
    readString(nft?.image?.originalUrl) ??
    getRawMetadataValue(metadata, "image");

  const thumbnailUrl =
    readString(nft?.image?.thumbnailUrl) ??
    readString(nft?.image?.cachedUrl) ??
    imageUrl;

  const animationUrl =
    getRawMetadataValue(metadata, "animation_url") ??
    getRawMetadataValue(metadata, "animationUrl");

  const normalizedAnimationUrl = normalizeIpfsUri(animationUrl);
  const normalizedImageUrl = normalizeIpfsUri(imageUrl);
  const normalizedThumbnailUrl = normalizeIpfsUri(thumbnailUrl);
  const imageAssetUrl = normalizedImageUrl ?? FALLBACK_MEDIA_URL;
  const primaryUrl = normalizedAnimationUrl ?? imageAssetUrl;
  const mediaType = normalizedAnimationUrl
    ? detectMediaType(primaryUrl, "html")
    : detectMediaType(primaryUrl, "image");

  return {
    imageUrl: normalizedImageUrl,
    animationUrl: normalizedAnimationUrl,
    thumbnailUrl: normalizedThumbnailUrl ?? imageAssetUrl,
    mediaType,
    primaryUrl,
  };
}

function nftToCacheMetadata(nft?: AlchemyNft) {
  const rawMetadata = nft?.raw?.metadata ?? null;

  return {
    rawMetadata,
    name: readString(nft?.name) ?? getRawMetadataValue(rawMetadata, "name"),
    description:
      readString(nft?.description) ??
      getRawMetadataValue(rawMetadata, "description"),
    tokenUri: getNftTokenUri(nft),
  };
}

async function getRecentSuccessfulRun({
  supabase,
  chainKey,
  walletAddress,
}: {
  supabase: SupabaseClient;
  chainKey: ChainKey;
  walletAddress: Address;
}) {
  const since = new Date(Date.now() - CACHE_TTL_MS).toISOString();

  const { data, error } = await supabase
    .from("dashboard_wallet_sync_runs")
    .select("id, finished_at")
    .eq("chain_key", chainKey)
    .eq("wallet_address", walletAddress)
    .eq("status", "success")
    .gte("finished_at", since)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to read dashboard wallet sync cache: ${error.message}`,
    );
  }

  return data as { id: string; finished_at: string } | null;
}

async function readCachedNfts({
  supabase,
  chainKey,
  walletAddress,
}: {
  supabase: SupabaseClient;
  chainKey: ChainKey;
  walletAddress: Address;
}) {
  const { data, error } = await supabase
    .from("dashboard_wallet_nft_cache")
    .select("*")
    .eq("chain_key", chainKey)
    .eq("wallet_address", walletAddress)
    .order("collection_key", { ascending: true })
    .order("token_id", { ascending: true });

  if (error) {
    throw new Error(`Failed to read dashboard NFT cache: ${error.message}`);
  }

  return (data ?? []) as DashboardCacheRow[];
}

function mapCacheRowsToNfts({
  rows,
  chainSet,
}: {
  rows: DashboardCacheRow[];
  chainSet: ChainSet;
}) {
  const collections = getChainCollections(chainSet);
  const byKey = new Map(
    collections.map((collection) => [collection.collectionKey, collection]),
  );

  return rows.map((row) => {
    const collection = byKey.get(row.collection_key);
    const tokenId = BigInt(row.token_id).toString();
    const name =
      row.name || `${collection?.name ?? row.collection_key} #${tokenId}`;
    const imageUrl = row.image_url || FALLBACK_MEDIA_URL;
    const assetUrl = row.animation_url || imageUrl;
    const thumbnailUrl =
      row.thumbnail_url || row.image_url || FALLBACK_MEDIA_URL;

    return {
      chainKey: row.chain_key,
      walletAddress: normalizeAddress(row.wallet_address),
      collectionKey: row.collection_key,
      collectionName: collection?.name ?? row.collection_key,
      collectionSymbol: collection?.symbol ?? row.collection_key.toUpperCase(),
      collectionAddress: normalizeAddress(row.collection_address),
      tokenId,
      ownerAddress: row.owner_address
        ? normalizeAddress(row.owner_address)
        : null,
      walletOwnsToken: row.wallet_owns_token,
      collectionApproved: row.collection_approved,
      stakeExists: row.stake_exists,
      stakeActive: row.stake_active,
      stakeValid: row.stake_valid,
      canStake: row.can_stake,
      canUnstake: row.can_unstake,
      stakedAtUnix:
        row.staked_at_unix === null
          ? null
          : BigInt(row.staked_at_unix).toString(),
      unstakedAtUnix:
        row.unstaked_at_unix === null
          ? null
          : BigInt(row.unstaked_at_unix).toString(),
      tokenUri: row.token_uri,
      metadataUri: row.metadata_uri,
      media: {
        assetType: row.media_type,
        assetUrl,
        imageUrl,
        animationUrl: row.animation_url,
        thumbnailUrl,
      },
      metadata: {
        name,
        description: row.description,
      },
      source: row.source,
      fetchedAt: row.last_fetched_at,
    } satisfies DashboardWalletNft;
  });
}

async function createSyncRun({
  supabase,
  chainKey,
  walletAddress,
  metadata,
}: {
  supabase: SupabaseClient;
  chainKey: ChainKey;
  walletAddress: Address;
  metadata: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from("dashboard_wallet_sync_runs")
    .insert({
      chain_key: chainKey,
      wallet_address: walletAddress,
      status: "running",
      metadata,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to start dashboard wallet sync: ${error.message}`);
  }

  return data as { id: string };
}

async function finishSyncRun({
  supabase,
  runId,
  status,
  errorMessage,
  metadata,
}: {
  supabase: SupabaseClient;
  runId: string;
  status: "success" | "failed";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  const update: Record<string, unknown> = {
    status,
    finished_at: new Date().toISOString(),
  };

  if (errorMessage) {
    update.error_message = errorMessage;
  }

  if (metadata) {
    update.metadata = metadata;
  }

  await supabase
    .from("dashboard_wallet_sync_runs")
    .update(update)
    .eq("id", runId);
}

async function buildFreshNfts({
  chainSet,
  walletAddress,
}: {
  chainSet: ChainSet;
  walletAddress: Address;
}) {
  const collections = getChainCollections(chainSet);
  const publicClient = createDashboardPublicClient(chainSet);
  const ownedNfts = await fetchOwnedNfts({
    chainSet,
    walletAddress,
    collections,
  });
  const historicalTokenIds = await fetchHistoricalTokenIds({
    chainSet,
    walletAddress,
    collections,
  });

  const ownedByCollection = new Map<CollectionKey, Map<string, AlchemyNft>>();

  for (const collection of collections) {
    ownedByCollection.set(collection.collectionKey, new Map());
  }

  for (const nft of ownedNfts) {
    const contractAddress = nft.contract?.address;
    const tokenId = tokenIdFromAlchemyNft(nft);

    if (!contractAddress || !tokenId) {
      continue;
    }

    const collection = collections.find((item) =>
      sameContract(item.contractAddress, contractAddress),
    );

    if (!collection) {
      continue;
    }

    ownedByCollection.get(collection.collectionKey)?.set(tokenId, nft);
  }

  const rows: Omit<
    DashboardCacheRow,
    "last_fetched_at" | "created_at" | "updated_at"
  >[] = [];
  const now = new Date().toISOString();

  for (const collection of collections) {
    const tokenIds = new Set<string>();
    const ownedMap =
      ownedByCollection.get(collection.collectionKey) ?? new Map();

    for (const tokenId of ownedMap.keys()) {
      tokenIds.add(tokenId);
    }

    for (const tokenId of historicalTokenIds.get(collection.collectionKey) ??
      []) {
      tokenIds.add(tokenId);
    }

    const stakedTokenIds = await publicClient.readContract({
      address: collection.stakingAddress,
      abi: stakingAbi,
      functionName: "getUserStakedTokenIds",
      args: [walletAddress, collection.contractAddress],
    });

    for (const tokenId of stakedTokenIds) {
      tokenIds.add(tokenId.toString());
    }

    const collectionApproved = await publicClient.readContract({
      address: collection.stakingAddress,
      abi: stakingAbi,
      functionName: "approvedCollection",
      args: [collection.contractAddress],
    });

    for (const tokenId of Array.from(tokenIds).sort((a, b) => {
      const left = BigInt(a);
      const right = BigInt(b);

      if (left === right) {
        return 0;
      }

      return left < right ? -1 : 1;
    })) {
      const tokenIdBigInt = BigInt(tokenId);
      const nft = ownedMap.get(tokenId);
      const baseMetadata = nftToCacheMetadata(nft);
      let tokenUri = baseMetadata.tokenUri;
      let rawMetadata = baseMetadata.rawMetadata;

      let ownerAddress: Address | null = null;

      try {
        ownerAddress = await publicClient.readContract({
          address: collection.contractAddress,
          abi: erc721SharedAbi,
          functionName: "ownerOf",
          args: [tokenIdBigInt],
        });
      } catch {
        ownerAddress = null;
      }

      if (!tokenUri && ownerAddress) {
        try {
          tokenUri = await publicClient.readContract({
            address: collection.contractAddress,
            abi: erc721SharedAbi,
            functionName: "tokenURI",
            args: [tokenIdBigInt],
          });
        } catch {
          tokenUri = null;
        }
      }

      if (!rawMetadata && tokenUri) {
        rawMetadata = await fetchTokenMetadataFromUri(tokenUri);
      }

      const stakePosition = (await publicClient.readContract({
        address: collection.stakingAddress,
        abi: stakingAbi,
        functionName: "getStakePosition",
        args: [walletAddress, collection.contractAddress, tokenIdBigInt],
      })) as StakePosition;

      const stakeValid = await publicClient.readContract({
        address: collection.stakingAddress,
        abi: stakingAbi,
        functionName: "isStakeValid",
        args: [walletAddress, collection.contractAddress, tokenIdBigInt],
      });

      const walletOwnsToken =
        ownerAddress !== null && sameAddress(walletAddress, ownerAddress);
      const canStake = Boolean(
        collectionApproved && walletOwnsToken && !stakePosition.active,
      );
      const canUnstake = Boolean(stakePosition.active);
      const media = buildMediaFields({ nft, metadata: rawMetadata });
      const name =
        baseMetadata.name ??
        getRawMetadataValue(rawMetadata, "name") ??
        `${collection.name} #${tokenId}`;
      const description =
        baseMetadata.description ??
        getRawMetadataValue(rawMetadata, "description");

      rows.push({
        chain_key: getChainKey(chainSet),
        wallet_address: walletAddress,
        collection_key: collection.collectionKey,
        collection_address: collection.contractAddress,
        token_id: tokenId,
        owner_address: ownerAddress,
        wallet_owns_token: walletOwnsToken,
        collection_approved: collectionApproved,
        stake_exists: stakePosition.exists,
        stake_active: stakePosition.active,
        stake_valid: stakeValid,
        can_stake: canStake,
        can_unstake: canUnstake,
        staked_at_unix:
          stakePosition.stakedAt > 0n
            ? stakePosition.stakedAt.toString()
            : null,
        unstaked_at_unix:
          stakePosition.unstakedAt > 0n
            ? stakePosition.unstakedAt.toString()
            : null,
        token_uri: tokenUri,
        metadata_uri: normalizeIpfsUri(tokenUri),
        name,
        description,
        image_url: media.imageUrl,
        animation_url: media.animationUrl,
        media_type: media.mediaType,
        thumbnail_url: media.thumbnailUrl,
        raw_metadata: rawMetadata,
        source: {
          alchemyOwned: ownedMap.has(tokenId),
          alchemyTransfers:
            historicalTokenIds.get(collection.collectionKey)?.has(tokenId) ??
            false,
          stakingHistory: stakedTokenIds.some(
            (value) => value === tokenIdBigInt,
          ),
          refreshedAt: now,
        },
      });
    }
  }

  return rows;
}

async function writeCacheRows({
  supabase,
  chainKey,
  walletAddress,
  rows,
}: {
  supabase: SupabaseClient;
  chainKey: ChainKey;
  walletAddress: Address;
  rows: Omit<
    DashboardCacheRow,
    "last_fetched_at" | "created_at" | "updated_at"
  >[];
}) {
  await supabase
    .from("dashboard_wallet_nft_cache")
    .delete()
    .eq("chain_key", chainKey)
    .eq("wallet_address", walletAddress);

  if (rows.length === 0) {
    return;
  }

  const lastFetchedAt = new Date().toISOString();
  const { error } = await supabase.from("dashboard_wallet_nft_cache").upsert(
    rows.map((row) => ({
      ...row,
      last_fetched_at: lastFetchedAt,
    })),
    {
      onConflict: "chain_key,wallet_address,collection_key,token_id",
    },
  );

  if (error) {
    throw new Error(`Failed to update dashboard NFT cache: ${error.message}`);
  }
}

export async function getDashboardWalletNfts({
  supabase,
  chainSet,
  account,
  forceRefresh = false,
}: {
  supabase: SupabaseClient;
  chainSet: ChainSet;
  account: string;
  forceRefresh?: boolean;
}) {
  if (!isAddress(account)) {
    throw new Error("Invalid wallet address.");
  }

  const walletAddress = getAddress(account);
  const chain = getChainForSet(chainSet);
  const chainKey = getChainKey(chainSet);

  if (!forceRefresh) {
    const recentRun = await getRecentSuccessfulRun({
      supabase,
      chainKey,
      walletAddress,
    });

    if (recentRun) {
      const cachedRows = await readCachedNfts({
        supabase,
        chainKey,
        walletAddress,
      });

      return {
        chain: chainSet,
        chainKey,
        chainId: chain.id,
        account: walletAddress,
        cacheStatus: "hit" as const,
        cacheTtlSeconds: CACHE_TTL_MS / 1000,
        fetchedAt: recentRun.finished_at,
        nfts: mapCacheRowsToNfts({ rows: cachedRows, chainSet }),
      };
    }
  }

  const run = await createSyncRun({
    supabase,
    chainKey,
    walletAddress,
    metadata: {
      chain: chainSet,
      forceRefresh,
      cacheTtlSeconds: CACHE_TTL_MS / 1000,
    },
  });

  try {
    const rows = await buildFreshNfts({ chainSet, walletAddress });
    await writeCacheRows({ supabase, chainKey, walletAddress, rows });
    await finishSyncRun({
      supabase,
      runId: run.id,
      status: "success",
      metadata: {
        chain: chainSet,
        nftCount: rows.length,
        forceRefresh,
      },
    });

    const cachedRows = await readCachedNfts({
      supabase,
      chainKey,
      walletAddress,
    });

    return {
      chain: chainSet,
      chainKey,
      chainId: chain.id,
      account: walletAddress,
      cacheStatus: "refresh" as const,
      cacheTtlSeconds: CACHE_TTL_MS / 1000,
      fetchedAt: new Date().toISOString(),
      nfts: mapCacheRowsToNfts({ rows: cachedRows, chainSet }),
    };
  } catch (error) {
    await finishSyncRun({
      supabase,
      runId: run.id,
      status: "failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Unknown dashboard sync error.",
    });

    throw error;
  }
}
