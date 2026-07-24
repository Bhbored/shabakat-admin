export interface AdminCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  isBanned: boolean;
  plan: string;
  createdAt: string;
  employeeCount: number;
  customerCount: number;
}
