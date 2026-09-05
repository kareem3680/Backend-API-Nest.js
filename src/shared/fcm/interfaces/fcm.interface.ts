export interface FcmSendResult {
  success: number;
  failed: number;
  failedTokens?: string[];
  messageId?: string;
}

export interface FcmBatchResult {
  success: number;
  failed: number;
  failedTokens: string[];
}

export interface FcmSendToUsersResult {
  success: number;
  failed: number;
  invalidTokens: Map<string, string>;
}

export interface UserTokenInfo {
  fcmTokens: string[];
  id: string;
}
