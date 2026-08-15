export type UserRole = 'Administrator' | 'CashierOperator';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfileResponse {
  uuid: string;
  username: string;
  firstName: string;
  lastName: string;
  roleName: UserRole;
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfileResponse;
}
