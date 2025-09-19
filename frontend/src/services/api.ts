import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  CreateUserRequest,
  Branch, 
  Service, 
  Customer, 
  Appointment, 
  Payment, 
  Expense,
  ReportTemplate,
  GeneratedReport,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  DashboardStats,
  FinancialSummary,
  AppointmentFormData,
  PaymentFormData,
  Province,
  Ward,
  CustomerFormData,
  ProfileFormData,
  ChangePasswordFormData
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
                { refresh: refreshToken }
              );
              
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<{ access: string; refresh: string }> = await this.api.post('/auth/token/', credentials);
    const { access, refresh } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Get user profile
    const userResponse = await this.getProfile();
    
    return {
      access,
      refresh,
      user: userResponse
    };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/profile/');
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response: AxiosResponse<DashboardStats> = await this.api.get('/users/dashboard/stats/');
    return response.data;
  }

  // Profile management endpoints
  async updateProfile(profileData: ProfileFormData): Promise<User> {
    const formData = new FormData();
    
    // Add all form fields
    formData.append('first_name', profileData.first_name);
    formData.append('last_name', profileData.last_name);
    formData.append('email', profileData.email);
    formData.append('phone', profileData.phone);
    formData.append('address', profileData.address);
    formData.append('specialization', profileData.specialization);
    formData.append('gender', profileData.gender);
    formData.append('date_of_birth', profileData.date_of_birth);
    formData.append('bio', profileData.bio);
    
    // Add avatar if provided
    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }
    
    const response: AxiosResponse<User> = await this.api.patch('/users/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async changePassword(passwordData: ChangePasswordFormData): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/users/profile/change-password/', passwordData);
    return response.data;
  }

  async deleteAvatar(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete('/users/profile/delete-avatar/');
    return response.data;
  }

  // User endpoints
  async getUsers(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/users/');
    return response.data;
  }

  async getDoctors(params?: Record<string, any>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/users/doctors/', { params });
    return response.data;
  }

  async getStaff(params?: Record<string, any>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/users/staff/', { params });
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/users/', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.patch(`/users/${userId}/`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.api.delete(`/users/${userId}/`);
  }

  // Location endpoints
  async getProvinces(): Promise<Province[]> {
    const response: AxiosResponse<Province[]> = await this.api.get('/locations/provinces/');
    return response.data;
  }

  async getWards(provinceCode: string): Promise<Ward[]> {
    const response: AxiosResponse<Ward[]> = await this.api.get(`/locations/wards/?province_code=${provinceCode}`);
    return response.data;
  }

  // Branch endpoints
  async getBranches(): Promise<ApiResponse<Branch>> {
    const response: AxiosResponse<ApiResponse<Branch>> = await this.api.get('/customers/branches/');
    return response.data;
  }

  async createBranch(branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> {
    const response: AxiosResponse<Branch> = await this.api.post('/customers/branches/', branch);
    return response.data;
  }

  async updateBranch(id: number, branch: Partial<Branch>): Promise<Branch> {
    const response: AxiosResponse<Branch> = await this.api.put(`/customers/branches/${id}/`, branch);
    return response.data;
  }

  async deleteBranch(id: number): Promise<void> {
    await this.api.delete(`/customers/branches/${id}/`);
  }

  // Service endpoints
  async getServices(): Promise<ApiResponse<Service>> {
    const response: AxiosResponse<ApiResponse<Service>> = await this.api.get('/customers/services/');
    return response.data;
  }

  async createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    const response: AxiosResponse<Service> = await this.api.post('/customers/services/', service);
    return response.data;
  }

  async updateService(id: number, service: Partial<Service>): Promise<Service> {
    const response: AxiosResponse<Service> = await this.api.put(`/customers/services/${id}/`, service);
    return response.data;
  }

  async deleteService(id: number): Promise<void> {
    await this.api.delete(`/customers/services/${id}/`);
  }

  // Customer endpoints
  async getCustomers(params?: Record<string, any>): Promise<ApiResponse<Customer>> {
    const response: AxiosResponse<ApiResponse<Customer>> = await this.api.get('/customers/customers/', { params });
    return response.data;
  }

  async getCustomer(id: number): Promise<Customer> {
    const response: AxiosResponse<Customer> = await this.api.get(`/customers/customers/${id}/`);
    return response.data;
  }

  async createCustomer(customer: CustomerFormData | any): Promise<Customer> {
    const response: AxiosResponse<Customer> = await this.api.post('/customers/customers/', customer);
    return response.data;
  }

  async updateCustomer(id: number, customer: Partial<CustomerFormData>): Promise<Customer> {
    const response: AxiosResponse<Customer> = await this.api.patch(`/customers/customers/${id}/`, customer);
    return response.data;
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.api.delete(`/customers/customers/${id}/`);
  }

  async searchCustomers(query: string): Promise<{ customers: Customer[] }> {
    const response: AxiosResponse<{ customers: Customer[] }> = await this.api.get('/customers/customers/search/', { params: { q: query } });
    return response.data;
  }

  async exportCustomersXlsx(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/customers/customers/export/xlsx/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'customers.xlsx');
  }

  async exportCustomersPdf(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/customers/customers/export/pdf/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'customers.pdf');
  }

  // Appointment endpoints
  async getAppointments(params?: Record<string, any>): Promise<ApiResponse<Appointment>> {
    const response: AxiosResponse<ApiResponse<Appointment>> = await this.api.get('/appointments/appointments/', { params });
    return response.data;
  }

  async getAppointment(id: number): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.get(`/appointments/appointments/${id}/`);
    return response.data;
  }

  async createAppointment(appointment: AppointmentFormData & { status?: Appointment['status'] }): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.post('/appointments/appointments/', appointment);
    return response.data;
  }

  async updateAppointment(id: number, appointment: AppointmentFormData & { status?: Appointment['status'] }): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.patch(`/appointments/appointments/${id}/`, appointment);
    return response.data;
  }

  async deleteAppointment(id: number): Promise<void> {
    await this.api.delete(`/appointments/appointments/${id}/`);
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const response: AxiosResponse<Appointment[]> = await this.api.get('/appointments/appointments/today/');
    return response.data;
  }

  async getUpcomingAppointments(): Promise<Appointment[]> {
    const response: AxiosResponse<Appointment[]> = await this.api.get('/appointments/appointments/upcoming/');
    return response.data;
  }

  async getAppointmentCalendar(params?: Record<string, any>): Promise<Appointment[]> {
    const response: AxiosResponse<Appointment[]> = await this.api.get('/appointments/appointments/calendar/', { params });
    return response.data;
  }

  async updateAppointmentStatus(id: number, status: string, notes?: string): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.post(`/appointments/appointments/${id}/status/`, { status, notes });
    return response.data;
  }

  async checkAppointmentAvailability(params: {
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    duration_minutes?: number;
    appointment_id?: number;
  }): Promise<{
    available: boolean;
    conflicts: Array<{
      id: number;
      time: string;
      duration: number;
      customer: string;
      status: string;
      services: string[];
    }>;
    is_past: boolean;
    message: string;
  }> {
    const response: AxiosResponse<{
      available: boolean;
      conflicts: Array<{
        id: number;
        time: string;
        duration: number;
        customer: string;
        status: string;
        services: string[];
      }>;
      is_past: boolean;
      message: string;
    }> = await this.api.get('/appointments/appointments/check-availability/', { params });
    return response.data;
  }

  async exportAppointmentsXlsx(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/appointments/appointments/export/xlsx/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'appointments.xlsx');
  }

  async exportAppointmentsPdf(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/appointments/appointments/export/pdf/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'appointments.pdf');
  }

  // Payment endpoints
  async getPayments(params?: Record<string, any>): Promise<ApiResponse<Payment>> {
    const response: AxiosResponse<ApiResponse<Payment>> = await this.api.get('/financials/payments/', { params });
    return response.data;
  }

  async getPayment(id: number): Promise<Payment> {
    const response: AxiosResponse<Payment> = await this.api.get(`/financials/payments/${id}/`);
    return response.data;
  }

  async createPayment(payment: PaymentFormData): Promise<Payment> {
    const response: AxiosResponse<Payment> = await this.api.post('/financials/payments/', payment);
    return response.data;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment> {
    const response: AxiosResponse<Payment> = await this.api.patch(`/financials/payments/${id}/`, payment);
    return response.data;
  }

  async deletePayment(id: number): Promise<void> {
    await this.api.delete(`/financials/payments/${id}/`);
  }

  async exportPaymentsXlsx(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/financials/payments/export/xlsx/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'financial_report.xlsx');
  }

  async exportPaymentsPdf(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/financials/payments/export/pdf/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'payments.pdf');
  }

  async fixPayments(): Promise<{ success: boolean; message: string; customers_processed: number }> {
    const response: AxiosResponse<{ success: boolean; message: string; customers_processed: number }> = 
      await this.api.post('/customers/fix-payments/');
    return response.data;
  }

  // Expense endpoints
  async getExpenses(params?: Record<string, any>): Promise<ApiResponse<Expense>> {
    const response: AxiosResponse<ApiResponse<Expense>> = await this.api.get('/financials/expenses/', { params });
    return response.data;
  }

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'branch_name' | 'created_by_name'>): Promise<Expense> {
    const response: AxiosResponse<Expense> = await this.api.post('/financials/expenses/', expense);
    return response.data;
  }

  async updateExpense(id: number, expense: Partial<Expense>): Promise<Expense> {
    const response: AxiosResponse<Expense> = await this.api.patch(`/financials/expenses/${id}/`, expense);
    return response.data;
  }

  async deleteExpense(id: number): Promise<void> {
    await this.api.delete(`/financials/expenses/${id}/`);
  }

  async exportExpensesXlsx(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/financials/expenses/export/xlsx/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'expenses.xlsx');
  }

  async exportExpensesPdf(params?: Record<string, any>): Promise<void> {
    const response = await this.api.get(`/financials/expenses/export/pdf/`, { params, responseType: 'blob' });
    this.downloadBlob(response.data, 'expenses.pdf');
  }

  async mergePayments(): Promise<{ success: boolean; message: string; merged_count: number; deleted_count: number }> {
    const response = await this.api.post('/financials/merge-payments/');
    return response.data;
  }

  // Report endpoints
  async getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
    const response: AxiosResponse<FinancialSummary> = await this.api.get('/financials/summary/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }

  async getRevenueByService(startDate?: string, endDate?: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/financials/revenue-by-service/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }

  async getWeeklyAppointments(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/financials/weekly-appointments/');
    return response.data;
  }

  async getServiceDistribution(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/financials/service-distribution/');
    return response.data;
  }

  async generateReport(reportData: Record<string, any>): Promise<GeneratedReport> {
    const response: AxiosResponse<GeneratedReport> = await this.api.post('/reports/generate/', reportData);
    return response.data;
  }

  async exportGeneratedReportXlsx(id: number): Promise<void> {
    const response = await this.api.get(`/reports/generated/${id}/export/xlsx/`, { responseType: 'blob' });
    this.downloadBlob(response.data, `report_${id}.xlsx`);
  }

  async exportGeneratedReportPdf(id: number): Promise<void> {
    const response = await this.api.get(`/reports/generated/${id}/export/pdf/`, { responseType: 'blob' });
    this.downloadBlob(response.data, `report_${id}.pdf`);
  }
}

export default new ApiService();
