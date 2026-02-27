// Pendle Fixed-Yield Types — matches live API responses

// GET /api/lending/pendle/markets
export interface PendleMarket {
  market_address: string;
  name: string;
  expiry: string;
  fixed_apy_pct: number;
  pendle_lp_apy_pct: number;
  tvl_usd: number;
  fee_rate: number;
  pt_address: string;
  yt_address: string;
  sy_address: string;
  deposit_token: string;
  deposit_token_address: string;
  deposit_token_decimals: number;
}

// GET /api/lending/pendle/compare
export interface PendleComparison {
  asset: string;
  pendle_market: string;
  pendle_fixed_apy: number;
  pendle_expiry: string;
  pendle_tvl: number;
  aave_variable_apy: number;
  apy_difference: number;
  market_address: string;
}

// GET /api/lending/pendle/positions
export interface PendlePosition {
  id: string;
  token: string;
  market_address: string;
  pt_address: string;
  deposit_token: string;
  amount_deposited: number;
  fixed_apy_pct: number;
  expiry: string;
  status: string;
  is_matured: boolean;
  current_value_estimate: number;
  created_at: string;
}

// POST /api/lending/pendle/deposit
export interface PendleDepositRequest {
  token: string;
  market_address: string;
  amount: number;
  user_address: string;
}

export interface PendleDepositResponse {
  deposit_id: string;
  deposit_address: string;
  deposit_token_address: string;
  deposit_token_symbol: string;
  instructions: string;
  status: string;
}

// POST /api/lending/pendle/withdraw
export interface PendleWithdrawRequest {
  token: string;
  position_id: string;
  user_address: string;
}

export interface PendleWithdrawResponse {
  position_id: string;
  status: string;
  tx_hash: string;
  amount_out: number;
  was_matured: boolean;
}
