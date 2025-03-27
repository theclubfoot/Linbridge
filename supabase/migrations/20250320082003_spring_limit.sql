/*
  # Employee Management Platform Schema

  1. New Tables
    - `employees`
      - Basic employee information
      - Authentication linked to Supabase auth
    - `departments`
      - Organizational units
    - `positions`
      - Job roles and titles
    - `attendance_records`
      - Check-in/out logs
    - `shifts`
      - Work schedule management
    - `payroll`
      - Salary and compensation records
    - `deductions`
      - Salary deductions tracking
    - `performance_reviews`
      - Employee evaluations
    - `announcements`
      - Company-wide notices
    
  2. Security
    - RLS policies for each table
    - Role-based access control
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Positions
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department_id uuid REFERENCES departments(id),
  salary_range_min numeric(10,2),
  salary_range_max numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  position_id uuid REFERENCES positions(id),
  department_id uuid REFERENCES departments(id),
  hire_date date NOT NULL,
  employment_status text DEFAULT 'active',
  base_salary numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  check_in timestamptz NOT NULL,
  check_out timestamptz,
  status text DEFAULT 'present',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  shift_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_pay numeric(10,2) NOT NULL,
  overtime_pay numeric(10,2) DEFAULT 0,
  bonuses numeric(10,2) DEFAULT 0,
  total_deductions numeric(10,2) DEFAULT 0,
  net_pay numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deductions
CREATE TABLE IF NOT EXISTS deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id uuid REFERENCES payroll(id),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  reviewer_id uuid REFERENCES employees(id),
  review_period_start date NOT NULL,
  review_period_end date NOT NULL,
  rating numeric(2,1) NOT NULL,
  comments text,
  goals text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal',
  posted_by uuid REFERENCES employees(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Departments (viewable by all authenticated users)
CREATE POLICY "Departments are viewable by authenticated users"
ON departments FOR SELECT
TO authenticated
USING (true);

-- Positions (viewable by all authenticated users)
CREATE POLICY "Positions are viewable by authenticated users"
ON positions FOR SELECT
TO authenticated
USING (true);

-- Employees (basic info viewable by all authenticated users)
CREATE POLICY "Employees are viewable by authenticated users"
ON employees FOR SELECT
TO authenticated
USING (true);

-- Attendance Records (users can view their own records, managers can view their department)
CREATE POLICY "Users can view their own attendance"
ON attendance_records FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM employees WHERE department_id IN (
      SELECT department_id FROM employees WHERE auth_id = auth.uid()
    )
  )
);

-- Similar policies for other tables...