export interface AaveRate {
  asset: string;
  symbol: string;
  supply_apy: number;
  variable_borrow_apy: number;
  liquidity: string;
  liquidity_formatted: string;
  atoken_address: string;
  underlying_address: string;
  decimals: number;
}

export interface EarnPosition {
  asset: string;
  balance: string;
  balance_formatted: string;
  value_usd: number;
  entry_amount: string;
  accrued_interest: string;
  apy_at_entry: number;
  deposited_at: string;
}

export interface EarnDepositRequest {
  token: string;
  asset: string;
  amount: string;
}

export interface EarnWithdrawRequest {
  token: string;
  asset: string;
  amount: string;
  destination: "reshield" | "wallet";
  wallet_address?: string;
}

export interface EarnTxResponse {
  status: "ok" | "error";
  tx_hash?: string;
  message?: string;
}
