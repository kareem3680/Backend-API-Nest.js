export interface IUser {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}
