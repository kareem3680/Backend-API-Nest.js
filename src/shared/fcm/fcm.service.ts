/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  cert,
  initializeApp,
  getApps,
  ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { fcmConfig } from '../../config/fcm.config';
import { FCM_ERROR_MESSAGES, FCM_BATCH_SIZE } from './constants/fcm.constants';
import {
  FcmSendResult,
  FcmBatchResult,
  FcmSendToUsersResult,
  UserTokenInfo,
} from './interfaces/fcm.interface';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    if (getApps().length > 0) {
      this.initialized = true;
      return;
    }

    try {
      const config = fcmConfig(this.configService);

      if (!config.projectId || !config.clientEmail || !config.privateKey) {
        this.logger.warn(
          'Firebase credentials incomplete, FCM service disabled',
        );
        return;
      }

      const firebaseConfig: ServiceAccount = {
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      };

      initializeApp({
        credential: cert(firebaseConfig),
      });

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase Admin SDK',
        error as Error,
      );
      this.initialized = false;
    }
  }

  async sendFCM(
    token: string,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<FcmSendResult> {
    if (!this.initialized) {
      this.logger.warn('FCM service not initialized');
      return { success: 0, failed: 1 };
    }

    if (!token) {
      throw new Error(FCM_ERROR_MESSAGES.TOKEN_REQUIRED);
    }

    const message = {
      token,
      notification: { title, body },
      android: { notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default' } } },
      data: data as Record<string, string>,
    };

    try {
      const response = await getMessaging().send(message);
      return { success: 1, failed: 0, messageId: response };
    } catch (error) {
      this.logger.error(`FCM send failed for token: ${token}`, error as Error);
      return { success: 0, failed: 1 };
    }
  }

  async sendFCMBatch(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<FcmBatchResult> {
    if (!this.initialized) {
      this.logger.warn('FCM service not initialized');
      return { success: 0, failed: tokens.length, failedTokens: tokens };
    }

    if (!tokens || tokens.length === 0) {
      return { success: 0, failed: 0, failedTokens: [] };
    }

    const message = {
      notification: { title, body },
      data: data as Record<string, string>,
      tokens,
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);

      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      return {
        success: response.successCount,
        failed: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      this.logger.error('FCM batch send failed', error as Error);
      return { success: 0, failed: tokens.length, failedTokens: tokens };
    }
  }

  async sendToUsers(
    users: UserTokenInfo[],
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<FcmSendToUsersResult> {
    if (!this.initialized || !users || users.length === 0) {
      return { success: 0, failed: 0, invalidTokens: new Map() };
    }

    const tokens: string[] = [];
    const tokenUserMap = new Map<string, string>();

    for (const user of users) {
      for (const token of user.fcmTokens) {
        tokens.push(token);
        tokenUserMap.set(token, user.id);
      }
    }

    if (tokens.length === 0) {
      return { success: 0, failed: 0, invalidTokens: new Map() };
    }

    let totalSuccess = 0;
    let totalFailed = 0;
    const invalidTokens = new Map<string, string>();

    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + FCM_BATCH_SIZE);
      const result = await this.sendFCMBatch(batchTokens, title, body, data);

      totalSuccess += result.success;
      totalFailed += result.failed;

      for (const failedToken of result.failedTokens) {
        const userId = tokenUserMap.get(failedToken);
        if (userId) {
          invalidTokens.set(failedToken, userId);
        }
      }
    }

    return { success: totalSuccess, failed: totalFailed, invalidTokens };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
