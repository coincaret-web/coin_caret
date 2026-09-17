export interface AssetWalletSummary {
  walletId: string;
  assetSymbol: string;
  assetName: string;
  decimals: number;
  address: string;
  availableBalance: string;
  reservedBalance: string;
  totalBalance: string;
}

export interface MultiWalletSummaryResponse {
  walletId: string;
  address: string;
  assetSymbol: string;
  assetName: string;
  availableBalance: string;
  reservedBalance: string;
  totalBalance: string;
  wallets: AssetWalletSummary[];
  transactions: any[];
}

export interface SendTransactionRequest {
  fromWalletId?: string;
  recipientAddress: string;
  amount: number | string;
  assetSymbol?: string;
  note?: string;
  idempotencyKey?: string;
}
