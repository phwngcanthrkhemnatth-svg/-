import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw, Check, ArrowRight, X, Lightbulb, AlertCircle } from 'lucide-react';
import { aiDraftService, DraftPostResult } from '../../services/aiDraftService';

interface BotDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (draft: DraftPostResult) => void;
}

const QUICK_TOPIC_EXAMPLES = [
  'อยากแชร์วิธีเรียนภาษาอังกฤษ',
  'อยากแนะนำการเขียนโปรแกรม',
  'อยากแชร์เทคนิคอ่านหนังสือสอบ',
  'อยากแนะนำทักษะ Canva',
];

export const BotDraftModal: React.FC<BotDraftModalProps> = ({
  isOpen,
  onClose,
  onApplyDraft,
}) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<DraftPostResult | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (selectedTopic?: string) => {
    const textToUse = (selectedTopic || topic).trim();
    if (!textToUse) {
      setError('กรุณาระบุหัวข้อหรือแนวคิดสั้นๆ เพื่อให้บอทช่วยเขียนโพสต์');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await aiDraftService.generateDraft(textToUse);
      setGeneratedDraft(result);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการสร้างร่างโพสต์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedDraft) {
      onApplyDraft(generatedDraft);
      onClose();
    }
  };

  const handleReset = () => {
    setGeneratedDraft(null);
    setTopic('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=SkillsWopDemoBot"
                alt="SkillsWop Demo Bot"
                className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/80 p-1 border border-indigo-200 dark:border-indigo-800"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  SkillsWop Demo Bot
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold tracking-wide">
                  SWP000001
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ผู้ช่วยสร้างร่างโพสต์แบ่งปันความรู้และแลกเปลี่ยนวิชา
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {!generatedDraft ? (
            <div className="space-y-4">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  กรอกหัวข้อหรือแนวคิดสั้น ๆ ที่คุณอยากแบ่งปัน บอทจะช่วยร่างเป็นโพสต์ที่สมบูรณ์ มีทั้งหัวข้อ เนื้อหา แท็กทักษะ และหมวดหมู่ที่เหมาะสมให้ทันที!
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  หัวข้อหรือแนวคิดที่ต้องการโพสต์
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น อยากแชร์วิธีเรียนภาษาอังกฤษ, อยากสอนพื้นฐาน Figma หรืออยากหาเพื่อนติว Python..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Topic Examples */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                  หรือคลิกเลือกตัวอย่างหัวข้อยอดนิยม:
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TOPIC_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setTopic(ex);
                        handleGenerate(ex);
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:text-indigo-900 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                    >
                      ✨ {ex}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* Draft preview view */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  ร่างโพสต์ที่บอทแนะนำ
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  หมวดหมู่: {generatedDraft.category}
                </span>
              </div>

              {/* Title */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  หัวข้อโพสต์
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {generatedDraft.title}
                </h4>
              </div>

              {/* Content */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  เนื้อหาโพสต์
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {generatedDraft.content}
                </p>
              </div>

              {/* Skill Tags */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  แท็กทักษะที่เกี่ยวข้อง
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {generatedDraft.skillTags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                💡 บอทจะไม่เผยแพร่โพสต์แทนคุณโดยอัตโนมัติ คุณสามารถตรวจสอบ ปรับแต่ง หรือแก้ไขเพิ่มเติมก่อนกดเผยแพร่ได้ตามต้องการ
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          {!generatedDraft ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading || !topic.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังคิดและเขียนร่าง...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>สร้างร่างโพสต์</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>สร้างใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                >
                  แก้ไขก่อนเผยแพร่
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>ใช้ร่างโพสต์นี้</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
