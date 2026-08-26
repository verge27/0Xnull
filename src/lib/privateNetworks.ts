/**
 * Single source of truth for 0xNull's private-network addresses and for
 * detecting which private transport the frontend is currently served from.
 *
 * Do not duplicate these constants anywhere else in the codebase.
 */

export const TOR_ADDRESS = 'onullluix4iaj77wbqf52dhdiey4kaucdoqfkaoolcwxvcdxz5j6duid.onion';
export const I2P_ADDRESS = 'fa4cv25ebmtimxgsqfb3jy3prm3yepllfct3kv3uasqclqn2arfa.b32.i2p';

export const TOR_URL = `http://${TOR_ADDRESS}`;
export const I2P_URL = `http://${I2P_ADDRESS}`;

export type PrivateNetwork = 'tor' | 'i2p';

export interface PrivateNetworkMirror {
  network: PrivateNetwork;
  label: string;
  address: string;
  url: string;
  guidePath: string;
  guideLabel: string;
  /** Exact notice required on every surface that advertises the mirror. */
  predictionsNotice: string;
}

export const PRIVATE_NETWORK_MIRRORS: PrivateNetworkMirror[] = [
  {
    network: 'tor',
    label: 'Tor onion service',
    address: TOR_ADDRESS,
    url: TOR_URL,
    guidePath: '/tor-guide',
    guideLabel: 'Tor guide',
    predictionsNotice: 'Predictions is not available over the Tor onion service.',
  },
  {
    network: 'i2p',
    label: 'I2P service',
    address: I2P_ADDRESS,
    url: I2P_URL,
    guidePath: '/i2p-guide',
    guideLabel: 'I2P guide',
    predictionsNotice: 'Predictions is not available over the I2P service.',
  },
];

const hostnameOf = (hostname?: string): string => {
  if (typeof hostname === 'string') return hostname.toLowerCase();
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
};

/** Returns 'tor' for .onion hosts, 'i2p' for .i2p (including .b32.i2p) hosts. */
export const getPrivateNetwork = (hostname?: string): PrivateNetwork | null => {
  const host = hostnameOf(hostname);
  if (!host) return null;
  if (host.endsWith('.onion')) return 'tor';
  if (host.endsWith('.i2p')) return 'i2p';
  return null;
};

export const isTorHost = (hostname?: string): boolean => getPrivateNetwork(hostname) === 'tor';
export const isI2pHost = (hostname?: string): boolean => getPrivateNetwork(hostname) === 'i2p';

/** True when the frontend is served from either private-network hostname. */
export const isPrivateNetwork = (hostname?: string): boolean => getPrivateNetwork(hostname) !== null;

/**
 * On a private-network host, API traffic must stay same-origin so it never
 * leaves the transport. Paths already begin with `/api`.
 */
export const privateApiUrl = (path: string): string =>
  path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
