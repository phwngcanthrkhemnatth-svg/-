import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserSkill, Report, ExchangeRequest } from '../types';
import { userService } from '../services/userService';
import { skillService } from '../services/skillService';
import { reportService } from '../services/reportService';
import { exchangeRequestService } from '../services/exchangeRequestService';
import { UserAvatar } from '../components/common/UserAvatar';
import { UserStatusBadge, ReportStatusBadge } from '../components/common/Badge';
import { AppLogo } from '../components/common/AppLogo';
import {
  Shield,
  Users,
  Sparkles,
  ArrowLeftRight,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  Search,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [users, setUsers] = useState<User[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'skills' | 'reports'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    const [uList, sList, rList, reqList] = await Promise.all([
      userService.getAllUsers(),
      skillService.getAllUserSkills(),
      reportService.getAll(),
      exchangeRequestService.getAll(),
    ]);
    setUsers(uList);
    setSkills(sList);
    setReports(rList);
    setRequests(reqList);
    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'warned' | 'suspended') => {
    await userService.setUserStatus(userId, newStatus);
    showToast(`อัปเดตสถานะผู้ใช้เป็น ${newStatus} สำเร็จ`);
    loadAdminData();
  };

  const handleResolveReport = async (reportId: string, actionNote: string, actionOnUser?: 'warn' | 'suspend') => {
    await reportService.updateReportStatus(reportId, 'Actioned', actionNote, actionOnUser);
    showToast('ดำเนินการปิดเรื่องร้องเรียนเรียบร้อย');
    loadAdminData();
  };

  // Stats
  const totalUsers = users.length;
  const newUsersThisWeek = Math.round(totalUsers * 0.4);
  const totalSkills = skills.length;
  const totalRequests = requests.length;
  const completedExchanges = requests.filter((r) => r.status === 'Accepted').length;
  const pendingReports = reports.filter((r) => r.status === 'Pending').length;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.province.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <AppLogo size="xl" className="shrink-0 drop-shadow-xl" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2 border border-rose-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>SkillsWop Admin Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ระบบจัดการและควบคุมส่วนกลาง (Admin Dashboard)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ตรวจสอบสถิติผู้ใช้งาน ทักษะ คำขอแลกเปลี่ยน และการกำกับดูแลความปลอดภัย
            </p>
          </div>
        </div>
      </div>

      {/* 6 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              +{newUsersThisWeek} สัปดาห์นี้
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {totalUsers} <span className="text-xs font-normal text-slate-400">คน</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">สมาชิกทั้งหมด (Total Users)</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs text-slate-400">8 หมวดหมู่</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {totalSkills} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">ทักษะที่ลงทะเบียน (Total Skills)</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-xs text-emerald-600 font-semibold">สำเร็จ {completedExchanges}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {totalRequests} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">คำขอแลกเปลี่ยน (Total Requests)</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs text-slate-400">อัตราจับคู่ 94%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {completedExchanges} <span className="text-xs font-normal text-slate-400">คู่</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">แลกเปลี่ยนสำเร็จ (Successful Matches)</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs text-slate-400">เดือนนี้ +28%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            4.85 <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">คะแนนความพึงพอใจเฉลี่ยระบบ</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs text-rose-600 font-bold">รอตรวจสอบ</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">
            {pendingReports} <span className="text-xs font-normal text-slate-400">เรื่อง</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">รายงานข้อร้องเรียน (Pending Reports)</div>
        </div>
      </div>

      {/* Visual Analytics / Charts Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Exchanges Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                สถิติการแลกเปลี่ยนทักษะรายเดือน (Monthly Exchanges)
              </h3>
              <p className="text-[11px] text-slate-500">อัตราการเติบโตอย่างต่อเนื่องตลอด 6 เดือนที่ผ่านมา</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              +42% MoM
            </span>
          </div>

          <div className="pt-4 h-44 flex items-end justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            {[
              { month: 'ต.ค.', val: 45, height: '35%' },
              { month: 'พ.ย.', val: 68, height: '52%' },
              { month: 'ธ.ค.', val: 92, height: '70%' },
              { month: 'ม.ค.', val: 110, height: '80%' },
              { month: 'ก.พ.', val: 135, height: '95%' },
              { month: 'มี.ค.', val: 148, height: '100%' },
            ].map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.val}
                </span>
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-xl transition-all group-hover:scale-105"
                  style={{ height: item.height }}
                />
                <span className="text-[11px] font-medium text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Categories Progress */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              สัดส่วนหมวดหมู่ทักษะยอดนิยม (Popular Categories)
            </h3>
            <p className="text-[11px] text-slate-500">หมวดหมู่ที่มีการสอนและขอเรียนรู้มากที่สุด</p>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { name: 'Design & Creative (กราฟิกและดีไซน์)', pct: 32, color: 'bg-indigo-600' },
              { name: 'Language (ภาษาต่างประเทศ)', pct: 28, color: 'bg-purple-600' },
              { name: 'Programming & Tech (โค้ดดิ้งและเทค)', pct: 22, color: 'bg-blue-600' },
              { name: 'Cooking & Bakery (อาหารและเบเกอรี่)', pct: 10, color: 'bg-amber-500' },
              { name: 'Music & Audio (ดนตรี)', pct: 8, color: 'bg-emerald-500' },
            ].map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                  <span className="text-slate-500">{cat.pct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs for Data Tables */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            จัดการสมาชิก ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'skills'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ทักษะในระบบ ({skills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            รายงานข้อร้องเรียน ({reports.length})
          </button>
        </div>

        {/* 1. Users Table */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                รายชื่อสมาชิกทั้งหมด
              </h3>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, อีเมล, จังหวัด..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                    <th className="pb-3">ผู้ใช้งาน</th>
                    <th className="pb-3">จังหวัด</th>
                    <th className="pb-3">คะแนน</th>
                    <th className="pb-3">สถานะ</th>
                    <th className="pb-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={u.profileImage} name={u.name} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{u.province}</td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        ⭐ {u.rating.toFixed(1)} ({u.reviewCount})
                      </td>
                      <td className="py-3">
                        <UserStatusBadge status={u.status} />
                      </td>
                      <td className="py-3 text-right space-x-1">
                        {u.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(u.id, 'active')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold"
                          >
                            เปิดใช้งาน
                          </button>
                        )}
                        {u.status !== 'warned' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(u.id, 'warned')}
                            className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-semibold"
                          >
                            ตักเตือน
                          </button>
                        )}
                        {u.status !== 'suspended' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold"
                          >
                            ระงับบัญชี
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Skills Table */}
        {activeTab === 'skills' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              รายการทักษะทั้งหมดที่สมาชิกได้ลงทะเบียนไว้
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                    <th className="pb-3">ชื่อทักษะ</th>
                    <th className="pb-3">หมวดหมู่</th>
                    <th className="pb-3">ประเภท</th>
                    <th className="pb-3">ระดับ</th>
                    <th className="pb-3">ผู้ลงทะเบียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {skills.map((sk) => {
                    const owner = users.find((u) => u.id === sk.userId);
                    return (
                      <tr key={sk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                          {sk.skillName}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{sk.category}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              sk.type === 'teach'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {sk.type === 'teach' ? 'สอนได้' : 'อยากเรียน'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{sk.level || '-'}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {owner?.name || 'User'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Reports Table */}
        {activeTab === 'reports' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              เรื่องร้องเรียนและการรายงานความประพฤติ
            </h3>

            <div className="space-y-3">
              {reports.map((rep) => {
                const reporter = users.find((u) => u.id === rep.reporterId);
                const reported = users.find((u) => u.id === rep.reportedUserId);

                return (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-600">สาเหตุ: {rep.reason}</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {new Date(rep.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <ReportStatusBadge status={rep.status} />
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <div>
                        ผู้รายงาน: <strong>{reporter?.name || 'ผู้ใช้'}</strong>
                      </div>
                      <div>→</div>
                      <div>
                        ผู้ถูกรายงาน: <strong className="text-rose-600">{reported?.name || 'ผู้ใช้'}</strong>
                      </div>
                    </div>

                    <p className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      "{rep.description}"
                    </p>

                    {rep.status === 'Pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleResolveReport(rep.id, 'ตักเตือนผู้ใช้งานแล้ว', 'warn');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors"
                        >
                          ตักเตือนผู้ถูกรายงาน
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id, 'ตรวจสอบแล้ว ไม่พบการกระทำผิด')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
                        >
                          ปิดเรื่องร้องเรียน
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {reports.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  ไม่มีรายงานข้อร้องเรียนในระบบ ปลอดภัย 100%
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
