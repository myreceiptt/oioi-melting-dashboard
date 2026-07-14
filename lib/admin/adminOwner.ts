import type { Address } from "viem";
import { sameAddress } from "@/lib/utils/address";

export const EXPECTED_ADMIN_OWNER_ADDRESS =
  "0x29bF68E3969E0b6686ea55B7C48241ba3f6B9bA0" as Address;

export function isExpectedAdminOwner(address: string | null | undefined) {
  if (!address) {
    return false;
  }

  try {
    return sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS);
  } catch {
    return false;
  }
}
