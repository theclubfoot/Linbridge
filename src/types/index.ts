export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position_id?: string;
  department_id?: string;
  hire_date: string;
  employment_status: string;
  base_salary: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Position {
  id: string;
  title: string;
  department_id?: string;
  salary_range_min?: number;
  salary_range_max?: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  check_in: string;
  check_out?: string;
  status: string;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_pay: number;
  overtime_pay?: number;
  bonuses?: number;
  total_deductions?: number;
  net_pay: number;
  status: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;
  rating: number;
  comments?: string;
  goals?: string;
  status: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority?: string;
  posted_by?: string;
  expires_at?: string;
}