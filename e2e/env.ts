export const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8080';
export const BASE_URL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';

export const CREDENTIALS = {
  admin: { username: 'admin', password: 'Admin123!' },
  cashier: { username: 'cashier', password: 'Cashier123!' },
} as const;

export type Role = keyof typeof CREDENTIALS;
