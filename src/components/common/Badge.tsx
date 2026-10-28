import React from 'react';
import { SkillLevel, RequestStatus, LearningMode, ScheduleStatus, ReportStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    gray: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold rounded-lg gap-2',
  };

  return (
    <span
      className={`inline-flex items-center border whitespace-nowrap leading-none transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export const SkillLevelBadge: React.FC<{ level?: SkillLevel }> = ({ level = 'ไม่ระบุ' }) => {
  if (!level || level === 'ไม่ระบุ') {
    return <Badge variant="secondary" size="sm">ไม่ระบุระดับ</Badge>;
  }

  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    Beginner: { label: 'ระดับเริ่มต้น (Beginner)', variant: 'blue' },
    Intermediate: { label: 'ระดับปานกลาง (Intermediate)', variant: 'purple' },
    Advanced: { label: 'ระดับเชี่ยวชาญ (Advanced)', variant: 'success' },
    Expert: { label: 'ระดับผู้เชี่ยวชาญ (Expert)', variant: 'primary' },
    มัธยมต้น: { label: 'ระดับมัธยมต้น', variant: 'blue' },
    มัธยมปลาย: { label: 'ระดับมัธยมปลาย', variant: 'blue' },
    ปวช: { label: 'ระดับ ปวช.', variant: 'purple' },
    'ปวช.': { label: 'ระดับ ปวช.', variant: 'purple' },
    ปวส: { label: 'ระดับ ปวส.', variant: 'purple' },
    'ปวส.': { label: 'ระดับ ปวส.', variant: 'purple' },
    ปริญญาตรี: { label: 'ระดับปริญญาตรี', variant: 'success' },
    บุคคลทั่วไป: { label: 'บุคคลทั่วไป', variant: 'secondary' },
  };

  const cfg = map[level] || { label: level, variant: 'secondary' };
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
};

export const StatusBadge: React.FC<{ status: RequestStatus | ScheduleStatus }> = ({ status }) => {
  switch (status) {
    case 'Pending':
      return <Badge variant="warning" size="sm">⏳ รอการตอบรับ</Badge>;
    case 'Accepted':
      return <Badge variant="success" size="sm">✓ ยอมรับแล้ว</Badge>;
    case 'Rejected':
      return <Badge variant="danger" size="sm">✕ ปฏิเสธ</Badge>;
    case 'Cancelled':
      return <Badge variant="gray" size="sm">ยกเลิกแล้ว</Badge>;
    case 'Upcoming':
      return <Badge variant="blue" size="sm">🗓️ กำลังจะมาถึง</Badge>;
    case 'Completed':
      return <Badge variant="success" size="sm">⭐ เสร็จสมบูรณ์</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
};

export const RequestStatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  return <StatusBadge status={status} />;
};

export const ScheduleStatusBadge: React.FC<{ status: ScheduleStatus }> = ({ status }) => {
  return <StatusBadge status={status} />;
};

export const UserStatusBadge: React.FC<{ status: 'active' | 'warned' | 'suspended' }> = ({ status }) => {
  switch (status) {
    case 'active':
      return <Badge variant="success" size="sm">ใช้งานปกติ</Badge>;
    case 'warned':
      return <Badge variant="warning" size="sm">ตักเตือน</Badge>;
    case 'suspended':
      return <Badge variant="danger" size="sm">ระงับบัญชี</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
};

export const ReportStatusBadge: React.FC<{ status: ReportStatus | string }> = ({ status }) => {
  switch (status) {
    case 'Pending':
    case 'pending':
      return <Badge variant="danger" size="sm">รอดำเนินการ</Badge>;
    case 'Actioned':
    case 'Reviewed':
    case 'resolved':
      return <Badge variant="success" size="sm">ดำเนินการแล้ว</Badge>;
    case 'Dismissed':
    case 'dismissed':
      return <Badge variant="gray" size="sm">ยกเลิกเรื่อง</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
};

export const LearningModeBadge: React.FC<{ mode: LearningMode }> = ({ mode }) => {
  switch (mode) {
    case 'Online':
      return <Badge variant="blue" size="sm">🌐 ออนไลน์ (Online)</Badge>;
    case 'On-site':
      return <Badge variant="purple" size="sm">📍 นอกสถานที่ (On-site)</Badge>;
    case 'Both':
      return <Badge variant="primary" size="sm">🔄 ทั้ง Online & On-site</Badge>;
  }
};
