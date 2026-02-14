// Address validation for XMR and ERC-20 (Arbitrum)

const XMR_REGEX = /^[48][1-9A-HJ-NP-Za-km-z]{94}$/;
const EVM_REGEX = /^0x[0-9a-fA-F]{40}$/;

export function isValidXmrAddress(addr: string): boolean {
  return XMR_REGEX.test(addr);
}

export function isValidEvmAddress(addr: string): boolean {
  return EVM_REGEX.test(addr);
}

export function isValidDestinationAddress(asset: string, addr: string): boolean {
  if (asset === 'XMR') return isValidXmrAddress(addr);
  return isValidEvmAddress(addr);
}

export function addressPlaceholder(asset: string): string {
  return asset === 'XMR' ? '4... or 8... (95 chars)' : '0x... (42 chars)';
}

export function addressError(asset: string, addr: string): string | null {
  if (!addr) return null;
  if (asset === 'XMR') {
    if (!/^[48]/.test(addr)) return 'Must start with 4 or 8';
    if (addr.length !== 95) return `Must be 95 characters (currently ${addr.length})`;
    if (!XMR_REGEX.test(addr)) return 'Invalid characters';
  } else {
    if (!addr.startsWith('0x')) return 'Must start with 0x';
    if (addr.length !== 42) return `Must be 42 characters (currently ${addr.length})`;
    if (!EVM_REGEX.test(addr)) return 'Invalid hex characters';
  }
  return null;
}
