export interface UpiIntentResponse {
  success: boolean;
  upiUrl?: string;
  qrCodeDataUrl?: string;
  upiId?: string;
  amount?: number;
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  contributionId?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

export interface UpiConfigResponse {
  success: boolean;
  upiId?: string;
  upiEnabled?: boolean;
  error?: string;
}

export interface ScreenshotUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface TransactionValidationResponse {
  isValid: boolean;
  isDuplicate: boolean;
  message?: string;
}
