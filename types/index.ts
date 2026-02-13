
export enum RiskLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ScamCategory {
  PHISHING = 'Falso Link / Phishing',
  SOCIAL_ENGINEERING = 'Engenharia Social (Falso Parente)',
  PRODUCT_NOT_DELIVERED = 'Produto não Entregue',
  INVESTMENT_FRAUD = 'Fraude de Investimento / Urubu do Pix',
  OTHER = 'Outro'
}

export interface PixReport {
  id?: string;
  key_hash: string;
  category: ScamCategory;
  has_bo: boolean;
  created_at?: string;
}

export interface RiskAnalysis {
  hash: string;
  score: number;
  reportCount: number;
  policeReportCount: number;
  level: RiskLevel;
  motivo?: string;
}
