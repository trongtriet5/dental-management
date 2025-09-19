import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Table, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { Customer, Branch, CustomerFormData, Service, User, Province, Ward } from '../types';
import TimePicker from '../components/TimePicker';
import DatePicker from '../components/DatePicker';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { formatTime, formatDate } from '../utils/time';
import { useAuth } from '../services/AuthContext';

// Import SweetAlert2
const Swal = require('sweetalert2');

// Load xlsx from CDN
let XLSX: any = null;

const loadXLSX = async () => {
  if (XLSX) return XLSX;
  
  try {
    // Try to load from node_modules first
    XLSX = require('xlsx');
    return XLSX;
  } catch (error) {
    // If not available, load from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => {
        XLSX = (window as any).XLSX;
        resolve(XLSX);
      };
      script.onerror = () => {
        console.error('Failed to load xlsx from CDN');
        reject(new Error('Failed to load xlsx library'));
      };
      document.head.appendChild(script);
    });
  }
};

// Helper function to remove Vietnamese diacritics
const removeVietnameseDiacritics = (str: string): string => {
  const diacriticsMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  };
  
  return str.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, (char) => diacriticsMap[char] || char);
};


// Helper function to parse date from DD/MM/YYYY format
const parseAppointmentDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Kiểm tra format DD/MM/YYYY
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Fallback cho format khác
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error, 'Input:', dateString);
    return null;
  }
};

// Helper function to parse consultant ID from notes
const parseConsultantFromNotes = (notes: string) => {
  if (!notes) return null;
  const consultantMatch = notes.match(/^CONSULTANT_ID:(\d+)/);
  return consultantMatch ? parseInt(consultantMatch[1]) : null;
};

// Helper function to get clean notes without consultant ID
const getCleanNotes = (notes: string) => {
  if (!notes) return '';
  return notes.replace(/^CONSULTANT_ID:\d+\n?/, '');
};


const Customers: React.FC = (): JSX.Element => {
  const { isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogError, setDialogError] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [appointmentDateRange, setAppointmentDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [selectedDoctor, setSelectedDoctor] = useState<number | ''>('');
  const [selectedConsultant, setSelectedConsultant] = useState<number | ''>('');
  const [customerAppointments, setCustomerAppointments] = useState<Record<number, any>>({});
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: 'male',
    date_of_birth: '',
    province_code: undefined,
    ward_code: undefined,
    street: '',
    medical_history: '',
    allergies: '',
    notes: '',
    branch: 0,
    services_used: [],
  });
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [appointmentDoctor, setAppointmentDoctor] = useState<number | ''>('');
  const [appointmentConsultant, setAppointmentConsultant] = useState<number | ''>('');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');
  const [createAppointment, setCreateAppointment] = useState<boolean>(false);
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);
  
  

  useEffect(() => {
    fetchData();
    fetchProvinces();
  }, []);

  // Reload appointments when filter changes
  useEffect(() => {
    if (customers.length > 0 && (selectedDoctor || selectedConsultant || appointmentDateRange.start || appointmentDateRange.end)) {
      loadAllCustomerAppointments(customers);
    }
  }, [selectedDoctor, selectedConsultant, appointmentDateRange.start, appointmentDateRange.end]);


  const fetchData = async () => {
    try {
      const [customersData, branchesData, servicesData, doctorsData, staffData] = await Promise.all([
        api.getCustomers(),
        api.getBranches(),
        api.getServices(),
        api.getDoctors(),
        api.getStaff(),
      ]);
      
      setCustomers(customersData.results);
      setBranches(branchesData.results);
      setServices(servicesData.results);
      setDoctors((doctorsData as any).results || (doctorsData as any));
      setStaff((staffData as any).results || (staffData as any));
      
      // Load appointments for all customers (async, don't wait)
      loadAllCustomerAppointments(customersData.results);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu khách hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllCustomerAppointments = async (customers: Customer[]) => {
    setAppointmentsLoading(true);
    try {
      const appointmentPromises = customers.map(async (customer) => {
        try {
          // Load tất cả appointments của customer để có dữ liệu đầy đủ cho filter
          const appointmentsData = await api.getAppointments({ 
            search: `${customer.full_name} ${customer.phone}`, 
            page_size: 100 
          });
          
          return {
            customerId: customer.id,
            appointments: appointmentsData.results || [],
            latestAppointment: appointmentsData.results && appointmentsData.results.length > 0 ? appointmentsData.results[0] : null
          };
        } catch (error) {
          console.error(`Error fetching appointments for customer ${customer.id}:`, error);
          return {
            customerId: customer.id,
            appointments: [],
            latestAppointment: null
          };
        }
      });

      const appointmentResults = await Promise.all(appointmentPromises);
      const appointmentsMap: Record<number, any> = {};
      
      appointmentResults.forEach(({ customerId, latestAppointment }) => {
        appointmentsMap[customerId] = latestAppointment;
      });
      
      setCustomerAppointments(appointmentsMap);
    } catch (error) {
      console.error('Error loading customer appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const provincesData = await api.getProvinces();
      setProvinces(provincesData);
    } catch (err) {
      setError('Không thể tải danh sách tỉnh thành');
    }
  };

  const fetchWards = async (provinceCode: string) => {
    try {
      const wardsData = await api.getWards(provinceCode);
      setWards(wardsData);
    } catch (err) {
      console.error('Error fetching wards:', err);
      setError('Không thể tải danh sách phường xã');
    }
  };

  // Helper function to parse consultant ID from notes
  const parseConsultantFromNotes = (notes: string) => {
    if (!notes) return null;
    const consultantMatch = notes.match(/^CONSULTANT_ID:(\d+)/);
    return consultantMatch ? parseInt(consultantMatch[1]) : null;
  };

  // Helper function to get clean notes without consultant ID
  const getCleanNotes = (notes: string) => {
    if (!notes) return '';
    return notes.replace(/^CONSULTANT_ID:\d+\n?/, '');
  };

  const fetchCustomerAppointments = async (customerId: number) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      
      const appointmentsData = await api.getAppointments({ 
        search: `${customer.full_name} ${customer.phone}`, 
        page_size: 1 
      });
      if (appointmentsData.results && appointmentsData.results.length > 0) {
        const latestAppointment = appointmentsData.results[0];
        setCurrentAppointment(latestAppointment);
        
        // Parse consultant ID from note
        const consultantId = parseConsultantFromNotes(latestAppointment.notes || '');
        const cleanNotes = getCleanNotes(latestAppointment.notes || '');
        
        // Populate appointment form with latest appointment data
        setAppointmentDate(latestAppointment.appointment_date);
        setAppointmentTime(latestAppointment.appointment_time);
        setAppointmentDoctor(latestAppointment.doctor);
        setAppointmentConsultant(consultantId || latestAppointment.created_by || '');
        setAppointmentNotes(cleanNotes);
        
        // Set services from appointment
        if (latestAppointment.services && latestAppointment.services.length > 0) {
          setSelectedServices(latestAppointment.services);
        }
      } else {
        setCurrentAppointment(null);
      }
    } catch (error) {
      console.error('Error fetching customer appointments:', error);
      setCurrentAppointment(null);
    }
  };

  const handleOpenDialog = async (customer?: Customer) => {
    await fetchData();

    setDialogError('');
    
    // Reset appointment data only for new customers
    if (!customer) {
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentDoctor('');
      setSelectedServices([]);
      setCurrentAppointment(null);
      // Reset address data for new customers
      setWards([]);
    }

    if (customer) {
      try {
        const detail = await api.getCustomer(customer.id);
        setEditingCustomer(detail);

        const validServiceIds = new Set(services.map(s => s.id));
        const filteredServices = (detail.services_used || []).map(service => 
          typeof service === 'object' ? service.id : service
        ).filter(id => validServiceIds.has(id));

        const formDataToSet = {
          first_name: detail.first_name,
          last_name: detail.last_name,
          phone: detail.phone,
          email: detail.email || '',
          gender: detail.gender,
          date_of_birth: detail.date_of_birth,
          province_code: detail.province_code,
          ward_code: detail.ward_code,
          street: detail.street || '',
          medical_history: detail.medical_history || '',
          allergies: detail.allergies || '',
          notes: detail.notes || '',
          branch: detail.branch,
          services_used: filteredServices,
        };
        setFormData(formDataToSet);
        setSelectedServices(filteredServices);
        if (detail.province_code) {
          await fetchWards(detail.province_code);
        }
        
        // Load customer's latest appointment
        await fetchCustomerAppointments(detail.id);
      } catch (e) {
        setEditingCustomer(customer);
      }
    } else {
      setEditingCustomer(null);
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        gender: 'male',
        date_of_birth: '',
        province_code: undefined,
        ward_code: undefined,
        street: '',
        medical_history: '',
        allergies: '',
        notes: '',
        branch: branches.length > 0 ? branches[0].id : 0,
        services_used: [],
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCustomer(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      gender: 'male',
      date_of_birth: '',
      province_code: undefined,
      ward_code: undefined,
      street: '',
      medical_history: '',
      allergies: '',
      notes: '',
      branch: 0,
      services_used: [],
    });
    setSelectedServices([]);
    setAppointmentDate('');
    setAppointmentTime('');
    setAppointmentDoctor('');
    setAppointmentConsultant('');
    setAppointmentNotes('');
    setCreateAppointment(false);
    
  };


  const handleSubmit = async () => {
    setDialogError('');
    setIsSubmitting(true);
    
    // Check authentication first
    if (!isAuthenticated) {
      setDialogError('Vui lòng đăng nhập để thực hiện thao tác này.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      setDialogError('');
      
      // Validation
      if (!formData.first_name.trim()) {
        setDialogError('Họ không được để trống');
        return;
      }
      
      if (!formData.last_name.trim()) {
        setDialogError('Tên không được để trống');
        return;
      }
      
      if (!formData.phone.trim()) {
        setDialogError('Số điện thoại không được để trống');
        return;
      }
      
      if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
        setDialogError('Số điện thoại phải có 10-11 chữ số');
        return;
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setDialogError('Email không hợp lệ');
        return;
      }
      
      if (!formData.date_of_birth) {
        setDialogError('Ngày sinh không được để trống');
        return;
      }
      
      if (!formData.branch || formData.branch === 0) {
        setDialogError('Vui lòng chọn chi nhánh');
        return;
      }
      
      // Validation cho ngày đặt hẹn
      if (createAppointment && appointmentDate) {
        const selectedDate = new Date(appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time để chỉ so sánh ngày
        
        if (selectedDate < today) {
          setDialogError('Ngày đặt hẹn không thể là ngày trong quá khứ');
          return;
        }
      }
      
      // Clean up form data before submission
      const submissionData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        province: formData.province_code || null,
        ward: formData.ward_code || null,
        street: formData.street?.trim() || '',
        medical_history: formData.medical_history?.trim() || '',
        allergies: formData.allergies?.trim() || '',
        notes: formData.notes?.trim() || '',
        branch: formData.branch,
        services_used: selectedServices.length > 0 ? selectedServices : (formData.services_used || [])
      };
      let saved: Customer;
      if (editingCustomer) {
        saved = await api.updateCustomer(editingCustomer.id, submissionData);
      } else {
        saved = await api.createCustomer(submissionData);
      }
      
      await fetchData();
      
      // Tạo customer first_name và last_name
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      
      // Tự động tạo thanh toán khi thêm khách hàng mới (không phải chỉnh sửa)
      if (!editingCustomer && selectedServices.length > 0) {
        try {
          // Tính tổng giá trị dịch vụ
          const totalAmount = selectedServices.reduce((total, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return total + (service ? service.price : 0);
          }, 0);
          
          if (totalAmount > 0) {
            // Tạo thanh toán tự động
            const paymentData = {
              customer: saved.id,
              services: selectedServices,
              branch: formData.branch,
              amount: totalAmount,
              payment_method: 'cash' as const,
              notes: `Thanh toán tự động khi tạo khách hàng ${fullName}`,
              status: 'pending' as const,
              paid_amount: 0
            };
            
            await api.createPayment(paymentData);
            
            // Hiển thị thông báo thành công với thông tin thanh toán
            await Swal.fire({
              icon: 'success',
              title: 'Thành công!',
              html: `
                <div class="text-start">
                  <p><strong>Khách hàng:</strong> ${fullName} đã được tạo thành công</p>
                  <p><strong>Thanh toán:</strong> Đã tự động tạo thanh toán ${formatCurrency(totalAmount)}</p>
                  <p class="text-muted small mt-2">
                    <i class="bi bi-info-circle me-1"></i>
                    Bạn có thể xem và quản lý thanh toán trong trang Thu chi
                  </p>
                </div>
              `,
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
            });
          } else {
            // Hiển thị thông báo thành công thông thường
            await Swal.fire({
              icon: 'success',
              title: 'Thành công!',
              text: `Khách hàng ${fullName} đã được tạo thành công`,
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
            });
          }
        } catch (paymentError: any) {
          console.error('Error creating payment:', paymentError);
          // Hiển thị thông báo thành công cho khách hàng nhưng cảnh báo về thanh toán
          await Swal.fire({
            icon: 'warning',
            title: 'Khách hàng đã được tạo',
            html: `
              <div class="text-start">
                <p><strong>Khách hàng:</strong> ${fullName} đã được tạo thành công</p>
                <p class="text-warning"><strong>Cảnh báo:</strong> Không thể tạo thanh toán tự động</p>
                <p class="text-muted small mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  Bạn có thể tạo thanh toán thủ công trong trang Thu chi
                </p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107'
          });
        }
      } else if (editingCustomer) {
        // Hiển thị thông báo thành công cho việc cập nhật
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: `Khách hàng ${fullName} đã được cập nhật thành công`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        });
      } else {
        // Hiển thị thông báo thành công thông thường
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: `Khách hàng ${fullName} đã được tạo thành công`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        });
      }
      
      // Không tạo lịch hẹn tự động khi thêm khách hàng
      // Lịch hẹn sẽ được tạo riêng thông qua trang Appointments
      if (false) { // Disabled automatic appointment creation
        try {
          // Kiểm tra tính khả dụng trước khi tạo/cập nhật lịch hẹn
          if (appointmentDoctor) {
            const availability = await api.checkAppointmentAvailability({
              doctor_id: Number(appointmentDoctor),
              appointment_date: appointmentDate,
              appointment_time: appointmentTime,
              duration_minutes: 60,
              appointment_id: currentAppointment?.id // Bỏ qua lịch hẹn hiện tại khi cập nhật
            });
            
            if (!availability.available) {
              let conflictMessage = 'Bác sĩ đã có lịch hẹn trùng thời gian:\n';
              availability.conflicts.forEach(conflict => {
                conflictMessage += `- ${conflict.time} (${conflict.duration} phút) - ${conflict.customer} (${conflict.status})\n`;
              });
              conflictMessage += '\nVui lòng chọn thời gian khác.';
              
              await Swal.fire({
                icon: 'error',
                title: 'Lỗi tạo lịch hẹn!',
                html: `
                  <div class="text-start">
                    <p><strong>Khách hàng:</strong> ${fullName} đã được ${editingCustomer ? 'cập nhật' : 'tạo'} thành công</p>
                    <p><strong>Lỗi:</strong> ${conflictMessage}</p>
                    <p class="text-muted small mt-2">
                      <i class="bi bi-info-circle me-1"></i>
                      Bạn có thể tạo lịch hẹn sau bằng cách chỉnh sửa khách hàng này
                    </p>
                  </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#dc3545'
              });
              return;
            }
          }
          
          const appointmentData = {
            customer_name: saved.full_name,
            customer_phone: saved.phone,
            doctor: appointmentDoctor || 0,
            branch: formData.branch,
            services: selectedServices,
            services_with_quantity: selectedServices.map(serviceId => ({ service_id: serviceId, quantity: 1 })),
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            duration_minutes: 60, // Default 60 minutes
            appointment_type: 'consultation' as const,
            notes: appointmentConsultant ? 
              `CONSULTANT_ID:${appointmentConsultant}${appointmentNotes ? '\n' + appointmentNotes : ''}` : 
              appointmentNotes,
            status: 'scheduled' as const
          };
          
          // Check if customer already has an appointment
          if (currentAppointment) {
            // Update existing appointment
            await api.updateAppointment(currentAppointment.id, appointmentData);
          } else {
            // Create new appointment
            await api.createAppointment(appointmentData);
          }
          
          // Tạo thanh toán khi khách hàng chấp nhận dịch vụ
          if (selectedServices.length > 0) {
            const totalAmount = selectedServices.reduce((total, serviceId) => {
              const service = services.find(s => s.id === serviceId);
              return total + (service ? service.price : 0);
            }, 0);

            if (totalAmount > 0) {
              const paymentData = {
                customer: saved.id,
                services: selectedServices,
                branch: formData.branch,
                amount: totalAmount,
                payment_method: 'cash' as const,
                notes: 'Thanh toán khi khách hàng chấp nhận dịch vụ'
              };

              await api.createPayment(paymentData);
            }
          }

          await Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: `${editingCustomer ? 'Cập nhật' : 'Thêm'} khách hàng: ${fullName}, ${currentAppointment ? 'cập nhật' : 'tạo'} lịch hẹn và tạo thanh toán`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#0d6efd'
          });
          
          // Close dialog after successful appointment creation
          handleCloseDialog();
        } catch (appointmentErr: any) {
          console.error('Appointment creation error:', appointmentErr);
          
          // Lấy thông báo lỗi cụ thể
          let errorMessage = 'Có lỗi khi tạo lịch hẹn';
          if (appointmentErr?.response?.data) {
            if (typeof appointmentErr.response.data === 'string') {
              errorMessage = appointmentErr.response.data;
            } else if (appointmentErr.response.data.non_field_errors) {
              errorMessage = appointmentErr.response.data.non_field_errors[0];
            } else if (appointmentErr.response.data.detail) {
              errorMessage = appointmentErr.response.data.detail;
            } else {
              // Lấy lỗi đầu tiên từ các field
              const firstError = Object.values(appointmentErr.response.data)[0] as any;
              if (Array.isArray(firstError)) {
                errorMessage = String(firstError[0]);
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              } else {
                errorMessage = String(firstError);
              }
            }
          }
          
          await Swal.fire({
            icon: 'error',
            title: `Lỗi ${currentAppointment ? 'cập nhật' : 'tạo'} lịch hẹn!`,
            html: `
              <div class="text-start">
                <p><strong>Khách hàng:</strong> ${fullName} đã được ${editingCustomer ? 'cập nhật' : 'tạo'} thành công</p>
                <p><strong>Lỗi lịch hẹn:</strong> ${errorMessage}</p>
                <p class="text-muted small mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  Bạn có thể ${currentAppointment ? 'cập nhật' : 'tạo'} lịch hẹn sau bằng cách chỉnh sửa khách hàng này
                </p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
          
          // Do NOT close dialog - let user fix the appointment error
          return;
        }
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: `Đã ${editingCustomer ? 'cập nhật' : 'thêm'} khách hàng: ${fullName}. Bạn có thể tạo lịch hẹn riêng cho khách hàng này trong trang "Quản lý lịch hẹn".`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
        
        // Close dialog after successful customer creation/update
        handleCloseDialog();
      }
    } catch (err: any) {
      // Parse error message for better display
      let errorMessage = 'Không thể lưu thông tin khách hàng';
      console.error('Customer creation/update error:', err);
      
      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      } else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors.join(', ');
        } else if (Array.isArray(err.response.data)) {
          errorMessage = err.response.data.join(', ');
        } else {
          // Handle field-specific errors
          const fieldErrors: string[] = [];
          Object.entries(err.response.data).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              fieldErrors.push(`${field}: ${messages}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setDialogError(errorMessage);
      // Do NOT close the dialog - let user fix the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa khách hàng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }) as { isConfirmed: boolean };

    if (result.isConfirmed) {
      try {
        await api.deleteCustomer(id);
        await fetchData();
        
        await Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: 'Khách hàng đã được xóa thành công.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
      } catch (err: any) {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể xóa khách hàng.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = (customer.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (customer.phone || '').includes(searchTerm);
    
    // Filter theo chi nhánh - sửa lỗi so sánh
    const matchesBranch = !selectedBranch || customer.branch === Number(selectedBranch);
    
    // Filter theo ngày hẹn
    const matchesAppointmentDateRange = (() => {
      if (!appointmentDateRange.start && !appointmentDateRange.end) return true;
      
      try {
        const appointment = customerAppointments[customer.id];
        
        
        if (!appointment || !appointment.appointment_date) {
          // Nếu không có appointment, trả về false để loại bỏ khách hàng này khỏi kết quả
          return false;
        }
        
        // Parse ngày appointment từ format DD/MM/YYYY
        const appointmentDateStr = appointment.appointment_date;
        const appointmentDate = parseAppointmentDate(appointmentDateStr);
        
        if (!appointmentDate) {
          console.error('Invalid appointment date:', appointmentDateStr);
          return false;
        }
        
        // Reset time để chỉ so sánh ngày (tránh timezone issues)
        const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        
        if (appointmentDateRange.start && appointmentDateRange.end) {
          const startDate = new Date(appointmentDateRange.start);
          const endDate = new Date(appointmentDateRange.end);
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          const result = appointmentDateOnly >= startDateOnly && appointmentDateOnly <= endDateOnly;
          
          return result;
        } else if (appointmentDateRange.start) {
          const startDate = new Date(appointmentDateRange.start);
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          
          const result = appointmentDateOnly >= startDateOnly;
          
          return result;
        } else if (appointmentDateRange.end) {
          const endDate = new Date(appointmentDateRange.end);
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          const result = appointmentDateOnly <= endDateOnly;
          
          return result;
        }
        
        return true;
      } catch (error) {
        console.error('Error filtering by appointment date:', error);
        return false; // Trả về false thay vì true để an toàn hơn
      }
    })();
    
    // Filter theo bác sĩ
    const matchesDoctor = (() => {
      if (!selectedDoctor) return true;
      
      const appointment = customerAppointments[customer.id];
      if (!appointment) return false;
      
      return appointment.doctor === Number(selectedDoctor);
    })();
    
    // Filter theo tư vấn viên
    const matchesConsultant = (() => {
      if (!selectedConsultant) return true;
      
      const appointment = customerAppointments[customer.id];
      if (!appointment) return false;
      
      const consultantId = parseConsultantFromNotes(appointment.notes || '');
      return consultantId === Number(selectedConsultant);
    })();
    
    
    return matchesSearch && matchesBranch && matchesAppointmentDateRange && matchesDoctor && matchesConsultant;
  });

  const getFullAddress = (customer: Customer) => {
    let address = [];
    if (customer.street) address.push(customer.street);
    if (customer.ward_name) address.push(customer.ward_name);
    if (customer.province_name) address.push(customer.province_name);
    return address.join(', ');
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang CS';
      case 'inactive': return 'Ngừng CS';
      case 'lead': return 'Tiềm năng';
      case 'success': return 'Thành công';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'primary';
      case 'inactive': return 'secondary';
      case 'lead': return 'warning';
      case 'success': return 'success';
      default: return 'secondary';
    }
  };

  const getAppointmentInfo = (customerId: number) => {
    const appointment = customerAppointments[customerId];
    if (!appointment) {
      return {
        date: '',
        time: '',
        doctor: '',
        consultant: '',
        branch: '',
        services: '',
        status: '',
        notes: ''
      };
    }

    const consultantId = parseConsultantFromNotes(appointment.notes || '');
    const consultantName = consultantId ? 
      (staff.find(s => s.id === consultantId) ? 
        `${staff.find(s => s.id === consultantId)?.last_name} ${staff.find(s => s.id === consultantId)?.first_name}` : 
        `ID: ${consultantId}`) : 
      'Chưa chỉ định';

    const servicesInfo = appointment.services && appointment.services.length > 0 
      ? appointment.services.map((serviceId: number) => {
          const service = services.find(s => s.id === serviceId);
          return service ? service.name : `ID: ${serviceId}`;
        }).join(', ')
      : 'Chưa chọn dịch vụ';

    const status = appointment.status === 'scheduled' ? 'Chờ xác nhận' :
                   appointment.status === 'confirmed' ? 'Đã xác nhận' :
                   appointment.status === 'arrived' ? 'Khách đã đến' :
                   appointment.status === 'in_progress' ? 'Đang điều trị' :
                   appointment.status === 'completed' ? 'Hoàn thành' :
                   appointment.status === 'cancelled' ? 'Đã hủy' :
                   appointment.status === 'no_show' ? 'Không đến' :
                   appointment.status || '';

    return {
      date: formatDate(appointment.appointment_date),
      time: formatTime(appointment.appointment_time || ''),
      doctor: appointment.doctor_name || 'Chưa chỉ định',
      consultant: consultantName,
      branch: appointment.branch_name || 'Chưa chỉ định',
      services: servicesInfo,
      status: status,
      notes: getCleanNotes(appointment.notes || '') || 'Không có'
    };
  };


  // Export Excel function
  const handleExportExcel = async () => {
    try {
      // Tạo tên file dựa trên filter đang áp dụng
      const getFileName = () => {
        const baseName = 'DanhSachKhachHang';
        const filters = [];
        
        if (searchTerm) {
          const cleanSearch = removeVietnameseDiacritics(searchTerm)
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '');
          filters.push(`TimKiem${cleanSearch}`);
        }
        if (selectedBranch) {
          const branch = branches.find(b => b.id === Number(selectedBranch));
          if (branch?.name) {
            const cleanBranchName = removeVietnameseDiacritics(branch.name)
              .replace(/[^a-zA-Z0-9\s]/g, '') // Loại bỏ ký tự đặc biệt
              .replace(/\s+/g, '') // Loại bỏ khoảng trắng
              .replace(/Chi nhánh|Chi nhánh|CN/gi, '') // Loại bỏ từ "Chi nhánh"
              .trim();
            filters.push(`ChiNhanh${cleanBranchName}`);
          }
        }
        if (selectedDoctor) {
          const doctor = doctors.find(d => d.id === Number(selectedDoctor));
          if (doctor) {
            const cleanDoctorName = removeVietnameseDiacritics(`${doctor.last_name}${doctor.first_name}`)
              .replace(/[^a-zA-Z0-9]/g, '') // Loại bỏ ký tự đặc biệt
              .replace(/Dr|Doctor|Bac si|Bác sĩ/gi, '') // Loại bỏ từ "Dr", "Doctor"
              .trim();
            filters.push(`BacSi${cleanDoctorName}`);
          }
        }
        if (selectedConsultant) {
          const consultant = staff.find(s => s.id === Number(selectedConsultant));
          if (consultant) {
            const cleanConsultantName = removeVietnameseDiacritics(`${consultant.last_name}${consultant.first_name}`)
              .replace(/[^a-zA-Z0-9]/g, '') // Loại bỏ ký tự đặc biệt
              .trim();
            filters.push(`TuVanVien${cleanConsultantName}`);
          }
        }
        if (appointmentDateRange.start || appointmentDateRange.end) {
          const startDate = appointmentDateRange.start ? appointmentDateRange.start.replace(/-/g, '') : '';
          const endDate = appointmentDateRange.end ? appointmentDateRange.end.replace(/-/g, '') : '';
          if (startDate && endDate) {
            filters.push(`${startDate}_${endDate}`);
          } else if (startDate) {
            filters.push(`Tu${startDate}`);
          } else if (endDate) {
            filters.push(`Den${endDate}`);
          }
        }
        
        if (filters.length > 0) {
          return `${baseName}_${filters.join('_')}`;
        }
        return baseName;
      };

      // Tạo thông báo chi tiết về dữ liệu được xuất
      const getExportInfo = () => {
        const info = [];
        if (searchTerm) info.push(`Tìm kiếm: "${searchTerm}"`);
        if (selectedBranch) {
          const branch = branches.find(b => b.id === Number(selectedBranch));
          info.push(`Chi nhánh: ${branch?.name || selectedBranch}`);
        }
        if (selectedDoctor) {
          const doctor = doctors.find(d => d.id === Number(selectedDoctor));
          info.push(`Bác sĩ: ${doctor ? `${doctor.last_name} ${doctor.first_name}` : selectedDoctor}`);
        }
        if (selectedConsultant) {
          const consultant = staff.find(s => s.id === Number(selectedConsultant));
          info.push(`Tư vấn viên: ${consultant ? `${consultant.last_name} ${consultant.first_name}` : selectedConsultant}`);
        }
        if (appointmentDateRange.start || appointmentDateRange.end) {
          const startDate = appointmentDateRange.start ? formatDate(appointmentDateRange.start) : '';
          const endDate = appointmentDateRange.end ? formatDate(appointmentDateRange.end) : '';
          info.push(`Ngày hẹn: ${startDate} ${startDate && endDate ? 'đến' : ''} ${endDate}`);
        }
        return info;
      };

      const fileName = await exportToExcel(filteredCustomers, services, staff, branches, getFileName(), getExportInfo());

      const exportInfo = getExportInfo();
      const infoText = exportInfo.length > 0 
        ? `Dữ liệu được xuất theo bộ lọc:\n${exportInfo.join('\n')}\n\n`
        : '';

      await Swal.fire({
        icon: 'success',
        title: 'Xuất Excel thành công!',
        text: `${infoText}Đã xuất ${filteredCustomers.length} khách hàng ra file: ${fileName}`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d6efd'
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi xuất Excel!',
        text: 'Không thể xuất file Excel. Vui lòng thử lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-0">Quản lý khách hàng</h2>
          <p className="text-muted mb-0">Thêm khách hàng sau khi chấp nhận dịch vụ và tạo thanh toán</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            className="btn-success-enhanced"
            onClick={handleExportExcel}
            disabled={filteredCustomers.length === 0}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Xuất Excel
          </Button>
        <Button
          variant="primary"
          className="btn-primary-enhanced"
          onClick={() => handleOpenDialog()}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Thêm khách hàng
        </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3">
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Card className="card-enhanced mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary fw-bold mb-0">
              <i className="bi bi-funnel me-2"></i>Bộ lọc và tìm kiếm
            </h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBranch('');
                  setSelectedDoctor('');
                  setSelectedConsultant('');
                  setAppointmentDateRange({start: '', end: ''});
                }}
                className="btn-outline-enhanced"
              >
                <i className="bi bi-x-circle me-1"></i>
                Xóa bộ lọc
              </Button>
            </div>
          </div>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Tìm kiếm khách hàng</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="enhanced-form"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Chi nhánh</Form.Label>
                <Form.Select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as number | '')}
                  className="enhanced-form"
                >
                  <option value="">Tất cả</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Bác sĩ</Form.Label>
                <Form.Select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value as number | '')}
                  className="enhanced-form"
                >
                  <option value="">Tất cả</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.last_name} {doctor.first_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Tư vấn viên</Form.Label>
                <Form.Select
                  value={selectedConsultant}
                  onChange={(e) => setSelectedConsultant(e.target.value as number | '')}
                  className="enhanced-form"
                >
                  <option value="">Tất cả</option>
                  {staff.map((consultant) => (
                    <option key={consultant.id} value={consultant.id}>
                      {consultant.last_name} {consultant.first_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3 mt-2">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Ngày hẹn</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    placeholder="Từ ngày"
                    value={appointmentDateRange.start}
                    onChange={(e) => setAppointmentDateRange({...appointmentDateRange, start: e.target.value})}
                    className="flex-fill"
                  />
                  <Form.Control
                    type="date"
                    placeholder="Đến ngày"
                    value={appointmentDateRange.end}
                    onChange={(e) => setAppointmentDateRange({...appointmentDateRange, end: e.target.value})}
                    className="flex-fill"
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-end h-100">
                <div className="text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Hiển thị {filteredCustomers.length} / {customers.length} khách hàng
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Customer List */}
      <Card className="card-enhanced">
        <Card.Body className="p-0">
          {appointmentsLoading && (
            <div className="d-flex justify-content-center align-items-center py-3" style={{ backgroundColor: '#f8f9fa' }}>
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">Đang tải thông tin lịch hẹn...</span>
            </div>
          )}
          <div className="table-responsive">
            <Table className="table-enhanced mb-0">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Thông tin cá nhân</th>
                  <th>Địa chỉ</th>
                  <th>Chi nhánh</th>
                  <th>Thông tin y tế</th>
                  <th>Lịch hẹn</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
          {filteredCustomers.map((customer) => {
            const appointmentInfo = getAppointmentInfo(customer.id);
            return (
                  <tr key={customer.id}>
                <td className="fw-semibold">
                  <div className="d-flex flex-column">
                    <span>{customer.full_name}</span>
                    <small className="text-muted">ID: {customer.id}</small>
                      </div>
                    </td>
                    <td>
                  <div className="d-flex flex-column">
                    <span>{customer.phone}</span>
                    <small className="text-muted">{customer.email || 'Chưa có email'}</small>
                      </div>
                    </td>
                <td>
                  <div className="d-flex flex-column">
                    <span>{customer.gender === 'male' ? 'Nam' : customer.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                    <small className="text-muted">{customer.date_of_birth || 'Chưa có ngày sinh'}</small>
                  </div>
                </td>
                <td>
                  <div className="text-truncate" title={getFullAddress(customer)}>
                    {getFullAddress(customer) || 'Chưa có địa chỉ'}
                  </div>
                </td>
                <td>
                  <div className="d-flex flex-column">
                    <span className="fw-semibold">
                      {branches.find(b => b.id === customer.branch)?.name || 'Chưa chỉ định'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex flex-column">
                    <div className="text-truncate" title={customer.medical_history || '-'}>
                      <small><strong>Tiền sử:</strong> {customer.medical_history || 'Không có'}</small>
                    </div>
                    <div className="text-truncate" title={customer.allergies || '-'}>
                      <small><strong>Dị ứng:</strong> {customer.allergies || 'Không có'}</small>
                    </div>
                      <div className="text-truncate" title={customer.notes || '-'}>
                      <small><strong>Ghi chú:</strong> {customer.notes || 'Không có'}</small>
                    </div>
                      </div>
                    </td>
                <td>
                  <div className="d-flex flex-column">
                    <div>
                      <span className="fw-semibold">{appointmentInfo.date || 'Chưa đặt hẹn'}</span>
                      <small className="text-muted d-block">{appointmentInfo.time || ''}</small>
                    </div>
                    <div>
                      <small><strong>Bác sĩ:</strong> {appointmentInfo.doctor}</small>
                    </div>
                    <div>
                      <small><strong>Tư vấn:</strong> {appointmentInfo.consultant}</small>
                    </div>
                    <div>
                      <span className={`badge ${
                        appointmentInfo.status === 'Hoàn thành' ? 'bg-success' :
                        appointmentInfo.status === 'Đã hủy' ? 'bg-danger' :
                        appointmentInfo.status === 'Đang điều trị' ? 'bg-warning' :
                        'bg-primary'
                      }`}>
                        {appointmentInfo.status || 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge bg-${getStatusVariant(customer.status)}`}>
                    {getStatusText(customer.status)}
                  </span>
                </td>
                <td>{formatDate(customer.created_at)}</td>
                <td className="text-end">
                  <div className="d-flex gap-1 justify-content-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenDialog(customer)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </td>
                  </tr>
            );
          })}
              </tbody>
        </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Customer Dialog */}
      <Modal show={showDialog} onHide={handleCloseDialog} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>
          {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="enhanced-form">
          {dialogError && (
            <Alert variant="danger" className="alert-enhanced mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div>
                  <strong>Lỗi xác thực:</strong>
                  <div className="mt-1">{dialogError}</div>
                  <small className="text-muted mt-2 d-block">
                    <i className="bi bi-info-circle me-1"></i>
                    Vui lòng kiểm tra và chỉnh sửa thông tin bên dưới, sau đó thử lại.
                  </small>
                </div>
              </div>
            </Alert>
          )}
          
          <Form>
            {/* Phần 1: Thông tin cá nhân */}
            <div className="mb-4">
              <h5 className="text-primary fw-bold mb-3">
                <i className="bi bi-person me-2"></i>1. Thông tin cá nhân
              </h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Họ *</Form.Label>
                  <Form.Control
                    type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Tên *</Form.Label>
                  <Form.Control
                    type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Số điện thoại *</Form.Label>
                  <Form.Control
                    type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                    className="enhanced-form"
                    isInvalid={Boolean(formData.phone && !/^[0-9]{10,11}$/.test(formData.phone))}
                  />
                  <Form.Control.Feedback type="invalid">
                    Số điện thoại phải có 10-11 chữ số
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="enhanced-form"
                    isInvalid={Boolean(formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))}
                  />
                  <Form.Control.Feedback type="invalid">
                    Email không hợp lệ
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Giới tính *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="enhanced-form"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Ngày sinh *</Form.Label>
                  <DatePicker
                    value={formData.date_of_birth}
                    onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                    required 
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="text-primary fw-bold mb-3 mt-4">Địa chỉ</h5>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Tỉnh/Thành phố</Form.Label>
                  <Form.Select
                    value={formData.province_code || ''}
                    onChange={(e) => {
                      const provinceCode = e.target.value;
                      setFormData({ ...formData, province_code: provinceCode, ward_code: undefined });
                      if (provinceCode) {
                        fetchWards(provinceCode);
                      } else {
                        setWards([]);
                      }
                    }}
                    className="enhanced-form"
                  >
                    <option value="">Chọn Tỉnh/Thành phố</option>
                    {provinces
                      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
                      .map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Phường/Xã</Form.Label>
                  <Form.Select
                    value={formData.ward_code || ''}
                    onChange={(e) => {
                      const wardCode = e.target.value;
                      setFormData({ ...formData, ward_code: wardCode });
                    }}
                    disabled={!formData.province_code}
                    className="enhanced-form"
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wards.length > 0 ? (
                      wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Chọn tỉnh thành trước</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Số nhà, tên đường</Form.Label>
                  <Form.Control
                    type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="text-primary fw-bold mb-3 mt-4">Thông tin y tế</h5>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Tiền sử bệnh</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Dị ứng</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            </Row>
            </div>


            {/* Phần 2: Thông tin đặt lịch hẹn - Đã tắt tự động tạo lịch hẹn */}
            <div className="mb-4" style={{ display: 'none' }}>
              <h5 className="text-primary fw-bold mb-3">
                <i className="bi bi-calendar-plus me-2"></i>2. Thông tin đặt lịch hẹn (Đã tắt)
              </h5>
              
              {/* Hiển thị lịch hẹn hiện tại nếu có */}
              {currentAppointment && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-success fw-semibold mb-0">
                      <i className="bi bi-calendar-check me-2"></i>Lịch hẹn hiện tại
                    </h6>
                    <small className="text-muted">
                      Tạo lúc: {currentAppointment.created_at}
                    </small>
                  </div>
                  <Card className="border-success">
                    <Card.Body style={{ maxWidth: '100%', overflow: 'hidden' }}>
                      <Row>
                        <Col md={6}>
                          <p className="mb-1"><strong>Ngày:</strong> {currentAppointment.appointment_date}</p>
                          <p className="mb-1"><strong>Giờ:</strong> {formatTime(currentAppointment.appointment_time)}</p>
                          <p className="mb-1"><strong>Bác sĩ:</strong> {currentAppointment.doctor_name || 'Chưa chỉ định'}</p>
                          <p className="mb-1"><strong>Chi nhánh:</strong> {currentAppointment.branch_name || 'Chưa chỉ định'}</p>
                          <p className="mb-1"><strong>Trạng thái:</strong> 
                            <span className={`badge ms-1 ${
                              currentAppointment.status === 'completed' ? 'bg-success' :
                              currentAppointment.status === 'cancelled' ? 'bg-danger' :
                              currentAppointment.status === 'in_progress' ? 'bg-warning' :
                              'bg-primary'
                            }`}>
                              {currentAppointment.status === 'scheduled' ? 'Chờ xác nhận' :
                               currentAppointment.status === 'confirmed' ? 'Đã xác nhận' :
                               currentAppointment.status === 'arrived' ? 'Khách đã đến' :
                               currentAppointment.status === 'in_progress' ? 'Đang điều trị' :
                               currentAppointment.status === 'completed' ? 'Hoàn thành' :
                               currentAppointment.status === 'cancelled' ? 'Đã hủy' :
                               currentAppointment.status === 'no_show' ? 'Không đến' :
                               currentAppointment.status}
                            </span>
                          </p>
                        </Col>
                        <Col md={6}>
                          <p className="mb-1"><strong>Dịch vụ đã chọn:</strong></p>
                          <div className="d-flex flex-wrap gap-1 mb-2" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                            {currentAppointment.services && currentAppointment.services.length > 0 ? (
                              currentAppointment.services.map((serviceId: number) => {
                                const service = services.find(s => s.id === serviceId);
                                return service ? (
                                  <span key={serviceId} className="badge bg-success" style={{ fontSize: '0.75em', maxWidth: '100%', wordBreak: 'break-word' }}>
                                    {service.name} - {formatCurrency(service.price || 0)}
                                  </span>
                                ) : (
                                  <span key={serviceId} className="badge bg-secondary" style={{ fontSize: '0.75em' }}>
                                    ID: {serviceId}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-muted">Chưa chọn dịch vụ</span>
                            )}
                          </div>
                          {(() => {
                            const consultantId = parseConsultantFromNotes(currentAppointment.notes || '');
                            return consultantId && (
                              <p className="mb-1"><strong>Tư vấn viên:</strong> {
                                staff.find(s => s.id === consultantId) 
                                  ? `${staff.find(s => s.id === consultantId)?.last_name} ${staff.find(s => s.id === consultantId)?.first_name}`
                                  : 'Chưa chỉ định'
                              }</p>
                            );
                          })()}
                          {(() => {
                            const cleanNotes = getCleanNotes(currentAppointment.notes || '');
                            return cleanNotes && (
                              <p className="mb-0 mt-2"><strong>Ghi chú:</strong> {cleanNotes}</p>
                            );
                          })()}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </div>
              )}
              
              <div className="d-flex align-items-center mb-3">
                <Form.Check
                  type="checkbox"
                  id="createAppointment"
                  checked={createAppointment}
                  onChange={(e) => setCreateAppointment(e.target.checked)}
                  className="me-2"
                />
                <Form.Label htmlFor="createAppointment" className="fw-bold text-primary mb-0">
                  <i className="bi bi-calendar-plus me-2"></i>
                  {editingCustomer ? 'Tạo lịch hẹn mới' : 'Tạo lịch hẹn ngay'}
                </Form.Label>
              </div>

                {createAppointment && (
                  <>
                    <h6 className="text-secondary fw-semibold mb-3">Thông tin lịch hẹn</h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Ngày đặt hẹn *</Form.Label>
                          <DatePicker
                            value={appointmentDate}
                            onChange={setAppointmentDate}
                            required={createAppointment}
                            className="enhanced-form"
                            min={new Date().toISOString().split('T')[0]}
                            isInvalid={appointmentDate ? new Date(appointmentDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false}
                          />
                          <Form.Control.Feedback type="invalid">
                            Ngày đặt hẹn không thể là ngày trong quá khứ
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Giờ đặt hẹn *</Form.Label>
                <TimePicker
                  value={appointmentTime}
                  onChange={setAppointmentTime}
                            required={createAppointment}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} lg={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Dịch vụ thực hiện *</Form.Label>
                          <div className="d-flex flex-wrap gap-1 mb-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                            {selectedServices.map((serviceId) => {
                              const service = services.find(s => s.id === serviceId);
                              return service ? (
                                <span 
                                  key={serviceId} 
                                  className="badge bg-primary d-flex align-items-center gap-1"
                                  style={{ 
                                    fontSize: '0.75rem',
                                    maxWidth: '100%',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  title={`${service.name} - ${formatCurrency(service.price || 0)}`}
                                >
                                  <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {service.name} - {formatCurrency(service.price || 0)}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    style={{ fontSize: '0.6em', flexShrink: 0 }}
                                    onClick={() => {
                                      setSelectedServices(selectedServices.filter(id => id !== serviceId));
                                    }}
                                  ></button>
                                </span>
                              ) : null;
                            })}
                          </div>
                          <Form.Select
                            value=""
                            onChange={(e) => {
                              const serviceId = parseInt(e.target.value);
                              if (serviceId && !selectedServices.includes(serviceId)) {
                                setSelectedServices([...selectedServices, serviceId]);
                              }
                            }}
                            className="enhanced-form"
                          >
                            <option value="">Chọn dịch vụ</option>
                            {services.filter(service => !selectedServices.includes(service.id)).map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - {formatCurrency(service.price || 0)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xs={12} lg={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Bác sĩ thực hiện</Form.Label>
                          <Form.Select
                            value={appointmentDoctor} 
                            onChange={(e) => setAppointmentDoctor(parseInt(e.target.value) || '')}
                            className="enhanced-form"
                          >
                            <option value="">Chọn bác sĩ</option>
                            {doctors && doctors.length > 0 ? (
                              doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.last_name} {doctor.first_name}
                                </option>
                              ))
                            ) : (
                              <option disabled>Không có bác sĩ nào</option>
                            )}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xs={12} lg={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Tư vấn viên</Form.Label>
                          <Form.Select
                            value={appointmentConsultant}
                            onChange={(e) => setAppointmentConsultant(parseInt(e.target.value) || '')}
                            className="enhanced-form"
                          >
                            <option value="">Chọn tư vấn viên</option>
                            {staff && staff.length > 0 ? (
                              staff.map((consultant) => (
                                <option key={consultant.id} value={consultant.id}>
                                  {consultant.last_name} {consultant.first_name}
                                </option>
                              ))
                            ) : (
                              <option disabled>Không có tư vấn viên nào</option>
                            )}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xs={12} lg={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Chi nhánh *</Form.Label>
                          <Form.Select
                            value={formData.branch}
                            onChange={(e) => setFormData({ ...formData, branch: parseInt(e.target.value) || 0 })}
                            className="enhanced-form"
                            required
                          >
                            <option value={0}>Chọn chi nhánh</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            Vui lòng chọn chi nhánh
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Ghi chú lịch hẹn</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={appointmentNotes}
                            onChange={(e) => setAppointmentNotes(e.target.value)}
                            className="enhanced-form"
                            placeholder="Ghi chú về lịch hẹn..."
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
            </div>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div>
              {dialogError && (
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  onClick={() => setDialogError('')}
                  className="me-2"
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Xóa lỗi
                </Button>
              )}
            </div>
            <div>
              <Button variant="outline-secondary" onClick={handleCloseDialog} className="btn-outline-enhanced me-2">
                Hủy
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                className="btn-primary-enhanced"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {editingCustomer ? 'Đang cập nhật...' : 'Đang thêm...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingCustomer ? 'Cập nhật' : 'Thêm'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Export Excel function
const exportToExcel = async (customers: Customer[], services: Service[], staff: User[], branches: Branch[], filename: string = 'danh_sach_khach_hang', filterInfo?: string[]) => {
  try {
    // Load xlsx library
    const xlsxLib = await loadXLSX();
    
    // Tạo header cho Excel
    const headers = [
      'Họ và tên',
      'Số điện thoại', 
      'Email',
      'Giới tính',
      'Ngày sinh',
      'Địa chỉ',
      'Chi nhánh',
      'Tiền sử bệnh',
      'Dị ứng',
      'Ghi chú',
      'Ngày đặt hẹn',
      'Giờ đặt hẹn',
      'Bác sĩ thực hiện',
      'Tư vấn viên',
      'Chi nhánh lịch hẹn',
      'Dịch vụ đặt hẹn',
      'Trạng thái lịch hẹn',
      'Ghi chú lịch hẹn'
    ];

    // Tạo dữ liệu Excel
    const excelData = await Promise.all(customers.map(async (customer, index) => {
      // Khởi tạo các biến cho thông tin lịch hẹn
      let appointmentDate = '';
      let appointmentTime = '';
      let doctorName = '';
      let consultantName = '';
      let branchName = '';
      let servicesInfo = '';
      let appointmentStatus = '';
      let appointmentNotes = '';
      
      // Lấy thông tin lịch hẹn cho khách hàng
      try {
        const appointmentsData = await api.getAppointments({ 
          search: `${customer.full_name} ${customer.phone}`, 
          page_size: 1 
        });
        if (appointmentsData.results && appointmentsData.results.length > 0) {
          const latestAppointment = appointmentsData.results[0];
          appointmentDate = formatDate(latestAppointment.appointment_date);
          appointmentTime = formatTime(latestAppointment.appointment_time || '');
          doctorName = latestAppointment.doctor_name || 'Chưa chỉ định';
          branchName = latestAppointment.branch_name || 'Chưa chỉ định';
          
          // Parse consultant từ notes
          const consultantId = parseConsultantFromNotes(latestAppointment.notes || '');
          if (consultantId) {
            const consultant = staff.find(s => s.id === consultantId);
            consultantName = consultant ? `${consultant.last_name} ${consultant.first_name}` : `ID: ${consultantId}`;
          } else {
            consultantName = 'Chưa chỉ định';
          }
          
          appointmentStatus = latestAppointment.status === 'scheduled' ? 'Chờ xác nhận' :
                             latestAppointment.status === 'confirmed' ? 'Đã xác nhận' :
                             latestAppointment.status === 'arrived' ? 'Khách đã đến' :
                             latestAppointment.status === 'in_progress' ? 'Đang điều trị' :
                             latestAppointment.status === 'completed' ? 'Hoàn thành' :
                             latestAppointment.status === 'cancelled' ? 'Đã hủy' :
                             latestAppointment.status === 'no_show' ? 'Không đến' :
                             latestAppointment.status || '';
          
          servicesInfo = latestAppointment.services && latestAppointment.services.length > 0 
            ? latestAppointment.services.map((serviceId: number) => {
                // Tìm tên dịch vụ từ danh sách services global
                const service = services.find(s => s.id === serviceId);
                return service ? service.name : `ID: ${serviceId}`;
              }).join(', ')
            : 'Chưa chọn dịch vụ';
            
          // Lấy clean notes (không có CONSULTANT_ID)
          appointmentNotes = getCleanNotes(latestAppointment.notes || '') || 'Không có';
        }
      } catch (error) {
        console.error('Error fetching appointment info:', error);
      }

      // Tạo địa chỉ đầy đủ
      const getFullAddress = (customer: Customer) => {
        let address = [];
        if (customer.street) address.push(customer.street);
        if (customer.ward_name) address.push(customer.ward_name);
        if (customer.province_name) address.push(customer.province_name);
        return address.join(', ');
      };

      return [
        customer.full_name || '',
        customer.phone || '',
        customer.email || '',
        customer.gender === 'male' ? 'Nam' : customer.gender === 'female' ? 'Nữ' : 'Khác',
        customer.date_of_birth || '',
        getFullAddress(customer),
        branches.find(b => b.id === customer.branch)?.name || 'Chưa chỉ định',
        customer.medical_history || '',
        customer.allergies || '',
        customer.notes || '',
        appointmentDate,
        appointmentTime,
        doctorName,
        consultantName,
        branchName,
        servicesInfo,
        appointmentStatus,
        appointmentNotes
      ];
    }));

    // Tạo workbook và worksheet
    const workbook = xlsxLib.utils.book_new();
    
    // Tạo dữ liệu cho worksheet
    const worksheetData = [];
    
    // Thêm thông tin filter nếu có
    if (filterInfo && filterInfo.length > 0) {
      worksheetData.push(['THÔNG TIN BỘ LỌC'], []);
      filterInfo.forEach(info => {
        worksheetData.push([info]);
      });
      worksheetData.push([]);
    }
    
    // Thêm thông tin tổng quan
    worksheetData.push(['THÔNG TIN TỔNG QUAN'], []);
    worksheetData.push(['Tổng số khách hàng:', customers.length]);
    worksheetData.push(['Ngày xuất:', formatDate(new Date().toISOString())]);
    worksheetData.push(['Thời gian xuất:', new Date().toLocaleTimeString('vi-VN')]);
    worksheetData.push([]);
    
    // Thêm header và dữ liệu
    worksheetData.push(headers);
    worksheetData.push(...excelData);
    
    const worksheet = xlsxLib.utils.aoa_to_sheet(worksheetData);

    // Thiết lập độ rộng cột
    const columnWidths = [
      { wch: 25 }, // Họ và tên
      { wch: 15 }, // Số điện thoại
      { wch: 30 }, // Email
      { wch: 10 }, // Giới tính
      { wch: 12 }, // Ngày sinh
      { wch: 40 }, // Địa chỉ
      { wch: 20 }, // Chi nhánh
      { wch: 30 }, // Tiền sử bệnh
      { wch: 30 }, // Dị ứng
      { wch: 30 }, // Ghi chú
      { wch: 15 }, // Ngày đặt hẹn
      { wch: 12 }, // Giờ đặt hẹn
      { wch: 25 }, // Bác sĩ thực hiện
      { wch: 20 }, // Tư vấn viên
      { wch: 20 }, // Chi nhánh lịch hẹn
      { wch: 40 }, // Dịch vụ đặt hẹn
      { wch: 20 }, // Trạng thái lịch hẹn
      { wch: 30 }  // Ghi chú lịch hẹn
    ];
    worksheet['!cols'] = columnWidths;

    // Thêm worksheet vào workbook
    xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Danh sách khách hàng');

    // Xuất file Excel
    const fileName = `${filename}.xlsx`;
    xlsxLib.writeFile(workbook, fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw error;
  }
};

export default Customers;
