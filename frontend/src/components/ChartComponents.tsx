import React, { Suspense, lazy } from 'react';
import { Spinner } from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Chart loading fallback
const ChartFallback = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
    <Spinner animation="border" size="sm" />
    <span className="ms-2">Đang tải biểu đồ...</span>
  </div>
);

// Revenue Chart Component
export const RevenueChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <ChartTooltip formatter={(value) => [new Intl.NumberFormat('vi-VN').format(Number(value)), 'VNĐ']} />
        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Appointments Chart Component
export const AppointmentsChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <ChartTooltip />
        <Bar dataKey="appointments" fill="#8884d8" />
        <Bar dataKey="completed" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Service Distribution Chart Component
export const ServiceDistributionChart: React.FC<{ data: any[] }> = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ service_name, usage_count }: { service_name: string; usage_count: number }) => `${service_name}: ${usage_count}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="usage_count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip formatter={(value: any) => [`${value} lần sử dụng`, 'Số lượng']} />
      </PieChart>
    </ResponsiveContainer>
  );
};
