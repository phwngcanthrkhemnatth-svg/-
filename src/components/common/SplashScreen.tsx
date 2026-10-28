import React from 'react';
import { AppLogo } from './AppLogo';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none">
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -top-12 -left-12 animate-pulse" />
      <div className="absolute w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -bottom-12 -right-12 animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        {/* Logo */}
        <div className="mb-6 animate-in zoom-in-95 duration-500">
          <AppLogo size="2xl" imgClassName="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_4px_24px_rgba(99,102,241,0.5)]" />
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
          SkillsWop
        </h1>

        {/* Tagline */}
        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs font-normal">
          แลกเปลี่ยนวิชาและทักษะที่สนใจร่วมกัน
          <br />
          <span className="text-slate-500 text-xs">เรียนรู้และเติบโตไปด้วยกัน</span>
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping delay-150" />
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping delay-300" />
        </div>
      </div>
    </div>
  );
};
