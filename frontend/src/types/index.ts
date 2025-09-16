// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'doctor' | 'creceptionist';
  phone?: string;
  address?: string;
  specialization?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  full_name?: string;
  role_display?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'doctor' | 'creceptionist';
  phone?: string;
  specialization?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  bio?: string;
  is_active: boolean;
  password: string;
}

// Branch types
export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  manager?: number;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Service types
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  level_number?: number;
}

// Location types
export interface Province {
  code: string;
  name: string;
  name_en?: string;
  full_name: string;
  full_name_en?: string;
  code_name?: string;
  administrative_unit_id?: number;
}

export interface Ward {
  code: string;
  name: string;
  name_en?: string;
  full_name: string;
  full_name_en?: string;
  code_name?: string;
  province_code: string;
  administrative_unit_id?: number;
}

// Customer types
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  age: number;
  province_code?: string;
  ward_code?: string;
  street?: string;
  province_name?: string;
  ward_name?: string;
  medical_history?: string;
  allergies?: string;
  notes?: string;
  branch: number;
  branch_name?: string;
  services_used?: Service[];
  status: 'active' | 'inactive' | 'lead' | 'success';
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Appointment types
export interface Appointment {
  id: number;
  customer: number;
  customer_name: string;
  doctor: number;
  doctor_name: string;
  consultant?: number;
  consultant_name?: string;
  branch: number;
  branch_name: string;
  services: number[];
  service_names: string;
  services_detail?: Service[];
  services_with_quantity: Array<{service_id: number, quantity: number}>;
  appointment_date: string;
  appointment_time: string;
  datetime: string;
  duration_minutes: number;
  appointment_type: 'consultation' | 'treatment' | 'follow_up' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  status_display?: string;
  notes?: string;
  is_past: boolean;
  is_today: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Payment types
export interface ServiceDetail {
  id: number;
  name: string;
  price: number;
  level_number: number;
}

export interface Payment {
  id: number;
  customer: number;
  customer_id: number;
  customer_name: string;
  appointment?: number;
  services: number[];
  services_names: string[];
  services_details: ServiceDetail[];
  branch: number;
  branch_name: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number | string;
  payment_percentage: number;
  is_fully_paid: boolean;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'other';
  status: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  payment_date?: string;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Expense types
export interface Expense {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: 'supplies' | 'equipment' | 'rent' | 'utilities' | 'salary' | 'marketing' | 'other';
  branch: number;
  branch_name?: string;
  expense_date: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Report types
export interface ReportTemplate {
  id: number;
  name: string;
  report_type: 'revenue' | 'expense' | 'appointment' | 'customer' | 'service' | 'doctor' | 'branch';
  description?: string;
  filters: Record<string, any>;
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedReport {
  id: number;
  template?: number;
  template_name?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  data: Record<string, any>;
  summary: Record<string, any>;
  generated_by?: number;
  generated_by_name?: string;
  generated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  count?: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Form types
export interface CustomerFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  province_code?: string;
  ward_code?: string;
  street: string;
  medical_history: string;
  allergies: string;
  notes: string;
  branch: number;
  services_used: number[];
}

export interface AppointmentFormData {
  customer: number;
  doctor: number;
  branch: number;
  services: number[];
  services_with_quantity: Array<{service_id: number, quantity: number}>;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: 'consultation' | 'treatment' | 'follow_up' | 'emergency';
  notes?: string;
}

export interface PaymentFormData {
  customer: number;
  appointment?: number;
  services: number[];
  branch: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'other';
  notes?: string;
}

// Dashboard types
export interface DashboardStats {
  total_customers: number;
  total_appointments: number;
  today_appointments: number;
  this_month_revenue: number;
  this_month_expenses: number;
  pending_payments: number;
}

// Financial summary with additional dashboard stats
export interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  pending_payments: number;
  total_quoted_amount: number;
  period_start: string;
  period_end: string;
  total_customers?: number;
  today_appointments?: number;
}

// Profile types
export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  bio: string;
  avatar?: File | null;
}

export interface ChangePasswordFormData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}
