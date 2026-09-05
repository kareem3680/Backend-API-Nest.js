import { SetMetadata } from '@nestjs/common';

export const COMPANY_CONTEXT_KEY = 'companyContext';
export const SkipCompanyContext = () => SetMetadata(COMPANY_CONTEXT_KEY, false);
