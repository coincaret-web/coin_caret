export interface PlatformConfigDto {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updatedByUserId?: string | null;
  updatedAt: string;
}

export interface CcUsdRateResponse {
  rate: string;
  updatedAt: string;
}

export interface UpdateCcUsdRateInput {
  rate: string;
}
