import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { postService } from '../../services/postService';
import { uploadPostImage } from '../../services/imageStorageService';
import { PostCategoryType } from '../../types';
import { BotDraftModal } from './BotDraftModal';
import { DraftPostResult } from '../../services/aiDraftService';
import {
  X,
  Image as ImageIcon,
  Link,
  Plus,
  Bot,
  Sparkles,
  Upload,
  AlertCircle,
  Tag,
  Check,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const POST_CATEGORIES: PostCategoryType[] = [
  'แชร์ความรู้',
  'แนะนำวิชา',
  'เทคนิคการเรียน',
  'ผลงาน',
  'ขอคำแนะนำ',
  'ทั่วไป',
];

const SUGGESTED_SKILL_TAGS = [
  'ภาษาอังกฤษ',
  'React',
  'กราฟิกดีไซน์',
  'การตัดต่อวิดีโอ',
  'Python',
  'Canva',
  'การตลาดออนไลน์',
  'การพูดในที่สาธารณะ',
  'Photoshop',
  'Figma',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { currentUser, showToast, triggerPostFeedRefresh } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategoryType>('แชร์ความรู้');
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Image states
  const [imageUrl, setImageUrl] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Bot draft modal state
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || tagInput).trim().replace(/^#/, '');
    if (tag && !skillTags.includes(tag)) {
      setSkillTags([...skillTags, tag]);
      if (!tagToAdd) setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSkillTags(skillTags.filter((t) => t !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('ขนาดรูปภาพต้องไม่เกิน 5 MB');
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setImageUrl('');
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyBotDraft = (draft: DraftPostResult) => {
    setTitle(draft.title);
    setContent(draft.content);
    setCategory(draft.category || 'แชร์ความรู้');
    if (draft.skillTags && Array.isArray(draft.skillTags)) {
      const merged = Array.from(new Set([...skillTags, ...draft.skillTags]));
      setSkillTags(merged);
    }
    showToast('บอทช่วยร่างโพสต์เรียบร้อย! คุณสามารถปรับแต่งก่อนกดเผยแพร่');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนสร้างโพสต์');
      return;
    }

    if (!title.trim()) {
      setError('กรุณาระบุหัวข้อโพสต์');
      return;
    }

    if (!content.trim()) {
      setError('กรุณากรอกเนื้อหาโพสต์');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl.trim();

      // Upload file if selected
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await uploadPostImage(imageFile, currentUser.id);
        } catch (imgErr) {
          console.warn('Image upload error:', imgErr);
        } finally {
          setIsUploadingImage(false);
        }
      }

      await postService.createPost({
        authorId: currentUser.id,
        authorUserId: currentUser.publicUserId || `SWP${currentUser.id.slice(-6)}`,
        authorName: currentUser.name,
        authorPhoto: currentUser.profileImage || '',
        authorImage: currentUser.profileImage || '',
        title: title.trim(),
        content: content.trim(),
        category: category,
        postCategory: category,
        imageUrl: finalImageUrl || undefined,
        skillTags: skillTags,
      });

      showToast('เผยแพร่โพสต์เรียบร้อยแล้ว!');
      triggerPostFeedRefresh();
      if (onPostCreated) onPostCreated();

      // Reset and close
      setTitle('');
      setContent('');
      setCategory('แชร์ความรู้');
      setSkillTags([]);
      handleRemoveImage();
      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการเผยแพร่โพสต์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  สร้างโพสต์ใหม่
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  แบ่งปันความรู้ แนะนำวิชา หรือหาเพื่อนแลกเปลี่ยนทักษะ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bot Assist Button */}
              <button
                type="button"
                onClick={() => setIsBotModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ให้บอทช่วยร่างโพสต์ (SkillsWop Demo Bot)"
              >
                <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">ให้บอทช่วยเขียนโพสต์</span>
                <span className="sm:hidden">บอทช่วยเขียน</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                หมวดหมู่โพสต์
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {POST_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                หัวข้อโพสต์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น เทคนิคฝึกพูดภาษาอังกฤษด้วยตนเอง, เริ่มต้นเขียน Python ฉบับมือใหม่..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Post Content */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                เนื้อหาโพสต์ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="แชร์ความรู้ เทคนิค หรือเรื่องราวที่คุณอยากบอกต่อ พร้อมระบุวิชาที่อยากแลกเปลี่ยนกับเพื่อนๆ ในชุมชน..."
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                required
              />
            </div>

            {/* Skill Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                แท็กทักษะที่เกี่ยวข้อง
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="พิมพ์ชื่อแท็ก เช่น Figma แล้วกด Enter หรือคลิกเพิ่ม"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มแท็ก
                </button>
              </div>

              {/* Selected Tags */}
              {skillTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {skillTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Tags */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <span>แท็กแนะนำคลิกเพิ่มได้เลย: </span>
                <div className="inline-flex flex-wrap gap-1 mt-1">
                  {SUGGESTED_SKILL_TAGS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAddTag(st)}
                      disabled={skillTags.includes(st)}
                      className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                        skillTags.includes(st)
                          ? 'opacity-40 line-through cursor-not-allowed text-slate-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      +{st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Attachment (Upload or URL) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  รูปภาพประกอบ (ถ้ามี)
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      imageTab === 'upload'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    อัปโหลดไฟล์
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      imageTab === 'url'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    ใส่ลิงก์ URL
                  </button>
                </div>
              </div>

              {imageTab === 'upload' ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="post-image-file"
                  />
                  <label
                    htmlFor="post-image-file"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      คลิกเพื่อเลือกรูปภาพจากเครื่อง
                    </span>
                    <span className="text-[10px] text-slate-400">
                      รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB
                    </span>
                  </label>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value || null);
                      setImageFile(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Image Preview Box */}
              {imagePreview && (
                <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 max-h-48">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    title="ลบรูปภาพ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังเผยแพร่...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>เผยแพร่</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bot Draft Helper Modal */}
      <BotDraftModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onApplyDraft={handleApplyBotDraft}
      />
    </>
  );
};
