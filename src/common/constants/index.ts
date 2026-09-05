export const GLOBAL_ROLES = ['super-admin', 'admin'] as const;

export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const USER_ROLES = ['super-admin', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const COMPANY_LEGAL_STATES = [
  'active',
  'suspended',
  'Expired',
  'under-establishment',
  'under-liquidation',
] as const;

export type CompanyLegalState = (typeof COMPANY_LEGAL_STATES)[number];

export const isGlobalRole = (role: string): role is GlobalRole => {
  return GLOBAL_ROLES.includes(role as GlobalRole);
};
