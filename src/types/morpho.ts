// Morpho Vault Yield Types — matches live API responses

// GET /api/lending/morpho/vaults
export interface MorphoVault {
  name: string;
  curator: string;
  address: string;
  tvl_human: number;
  asset: string;
  max_deposit?: number;
}

export interface MorphoVaultsResponse {
  vaults: Record<string, MorphoVault[]>;
}

// GET /api/lending/morpho/positions
export interface MorphoPosition {
  vault_address: string;
  shares: number;
  assets: number;
  assets_human: number;
  max_withdraw: number;
  max_withdraw_human: number;
  decimals: number;
  vault_name: string;
  curator: string;
  asset_symbol: string;
}

export interface MorphoPositionsResponse {
  positions: MorphoPosition[];
  total_deposited_usd: number;
  wallet: string;
}

// GET /api/lending/morpho/rates/{asset}
export interface MorphoRateVault {
  vault: string;
  curator: string;
  address: string;
  tvl: number;
  asset: string;
}

export interface MorphoRatesResponse {
  asset: string;
  vaults: MorphoRateVault[];
}

// GET /api/lending/morpho/vault/{vault_address}
export interface MorphoVaultDetail {
  vault: {
    vault_address: string;
    name: string;
    asset_symbol: string;
    decimals: number;
    total_assets_human: number;
  };
  position: {
    shares: number;
    assets: number;
    assets_human: number;
    max_withdraw_human: number;
  };
}

// POST /api/lending/morpho/deposit
export interface MorphoDepositRequest {
  token: string;
  asset: string;
  amount: number;
  vault_address?: string;
}

export interface MorphoDepositResponse {
  status: string;
  tx_hash: string;
  amount: number;
  asset: string;
  protocol: string;
  shares_received: number;
  total_deposited: number;
}

// POST /api/lending/morpho/withdraw
export interface MorphoWithdrawRequest {
  token: string;
  asset: string;
  amount: number;
  vault_address?: string;
  destination_address?: string;
}

export interface MorphoWithdrawResponse {
  status: string;
  withdraw_tx: string;
  payout_tx?: string;
  payout_status?: string;
  amount: number;
  asset: string;
  destination?: string;
  protocol: string;
  detail?: string;
}

// GET /api/lending/morpho/health
export interface MorphoHealthResponse {
  status: string;
  protocol: string;
  chain: string;
  chain_id: number;
  morpho_core: string;
  wallet: string;
  test_vault: string;
  test_vault_tvl: number;
}
