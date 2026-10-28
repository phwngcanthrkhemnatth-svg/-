import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppLogo } from '../components/common/AppLogo';
import { Sparkles, Mail, Lock, LogIn, ArrowRight, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, resetPassword, setCurrentView } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password reset modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMsg, setResetMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMsg('กรุณากรอกอีเมลของคุณ');
      setResetStatus('error');
      return;
    }
    setResetStatus('loading');
    setResetMsg('');
    try {
      await resetPassword(resetEmail.trim());
      setResetStatus('success');
      setResetMsg(`ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง ${resetEmail} เรียบร้อยแล้ว`);
    } catch (err: any) {
      setResetStatus('error');
      setResetMsg(err?.message || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ กรุณาตรวจสอบอีเมลอีกครั้ง');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
            <AppLogo size="xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">เข้าสู่ระบบ SkillsWop</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            เข้าสู่ระบบเพื่อเริ่มแลกเปลี่ยนทักษะและเชื่อมต่อกับเพื่อนร่วมเรียนรู้
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1 leading-relaxed font-medium">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetStatus('idle');
                  setResetMsg('');
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="btn-submit-login"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>

        {/* Divider and Register CTA */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">ยังไม่มีบัญชีสมาชิกใช่ไหม?</span>
          </div>

          <button
            type="button"
            id="btn-goto-register"
            onClick={() => setCurrentView('register')}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-indigo-600/20 hover:border-indigo-600 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>สมัครสมาชิกใหม่ฟรี</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                รีเซ็ตรหัสผ่าน (Reset Password)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กรอกอีเมลที่ลงทะเบียนไว้ ระบบของ Firebase จะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังกล่องข้อความของคุณ
              </p>
            </div>

            {resetStatus === 'success' ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                {resetStatus === 'error' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
                    {resetMsg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมลที่ใช้สมัคร
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {resetStatus === 'loading' ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
                  </button>
                </div>
              </form>
            )}

            {resetStatus === 'success' && (
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
