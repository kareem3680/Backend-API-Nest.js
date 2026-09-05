import { Request as ExpressRequest } from 'express';

export interface RequestUser {
  _id: string;
  name: string;
  email?: string;
  role: string;
  companyId?: string | null;
  active: boolean;
  profileImage?: string;
  phone?: string;
  position?: string;
  jobId?: number;
  hireDate: Date;
}

export interface Request extends ExpressRequest {
  user?: RequestUser;
  companyId?: string | null;
  cleanedQuery?: Record<string, unknown>;
}
