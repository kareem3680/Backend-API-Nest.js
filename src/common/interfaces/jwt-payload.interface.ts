export interface JwtPayload {
  userId: string;
  companyId?: string;
  role: string;
  iat?: number;
}
