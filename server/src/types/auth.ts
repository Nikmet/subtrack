export type UserRole = "USER" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
