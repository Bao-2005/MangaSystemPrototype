import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { validatePublicationDate } from '../../utils/validators';
import { canCreateChapter } from '../../utils/permissions';
import { showToast } from '../../utils/toast';

import {
  ArrowLeft, Upload, FileText, ImageIcon, MessageSquare,
  PlusCircle, PenTool, CheckCircle, BookOpen, Layers,
  Info, AlertCircle, CalendarDays, Hash, ScrollText
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Mô tả quy trình thực tế của Mangaka ───────────────────────────────────
// Khi bắt đầu một chapter mới, Mangaka cần khai báo thông tin lên hệ thống
// để Editor và Assistant biết lịch trình. Bao gồm:
//   1. Thông tin định danh (series, số chapter, tiêu đề, ngày xuất bản)
//   2. Tóm tắt nội dung (synopsis) để editor nắm bắt
//   3. Kịch bản / Storyboard (nếu có) — file PDF hoặc ảnh
//   4. Bản thảo tranh thô (rough draft) hoặc đã ink xong (nếu muốn giao trước)
//   5. Ghi chú đặc biệt cho Editor (double-spread, lettering dạng đặc biệt, v.v.)
// ────────────────────────────────────────────────────────────────────────────

export default function SubmitChapterPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.currentUser);
  const { series } = useSeriesStore();
  const { addChapter } = useChapterStore();

  const activeMangakaSeries = series.filter(
    s => s.mangakaId === user?.id && s.status === 'Active'
  );

  const [formData, setFormData] = useState({
    seriesId: '',
    chapterNo: '',
    title: '',
    publicationDate: '',
    totalPages: 20,
    synopsis: '',
    notes: '',
    storyboardFiles: [],
    manuscriptFiles: [],
  });
  const [errors, setErrors] = useState({});

  // ─── Sample data dựa trên quy trình thực của mangaka ───────────────────
  const handleFillSample = () => {
    if (activeMangakaSeries.length === 0) {
      showToast('Bạn cần có series đang Active để thử demo.', 'error');
      return;
    }
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split('T')[0];

    setFormData({
      seriesId: activeMangakaSeries[0].id,
      chapterNo: 12,
      title: 'Sự Thức Tỉnh Của Rồng Thần',
      publicationDate: dateStr,
      totalPages: 24,
      synopsis:
        'Trong chương này, nhân vật chính Ryuu lần đầu tiên giải phóng sức mạnh rồng thần tiềm ẩn khi phải đối đầu trực tiếp với hội đồng hắc ám. ' +
        'Bí mật về nguồn gốc của thanh gươm ánh sáng dần được hé lộ qua flashback. ' +
        'Cú twist lớn cuối chương: người đồng đội cũ mà Ryuu tưởng đã mất 3 năm trước bất ngờ xuất hiện để giải vây.',
      notes:
        'Gửi Editor Nakamura: Trang 12–13 là cảnh chiến đấu dùng DOUBLE-SPREAD (trang đôi). ' +
        'Vui lòng lưu ý khi dàn trang in ấn không cắt đứt giữa. ' +
        'Trang 20: lời thoại của nhân vật phụ dùng font italic để phân biệt với nhân vật chính.',
      storyboardFiles: [
        { name: 'Ch12_Storyboard_v2.pdf', size: '3.2 MB', type: 'pdf' },
      ],
      manuscriptFiles: [
        { name: 'Ch12_Page_01-11_Pencil.zip', size: '28 MB', type: 'zip' },
        { name: 'Ch12_Page_12-13_Spread_Ink.tif', size: '18 MB', type: 'tif' },
        { name: 'Ch12_Page_14-24_Pencil.zip', size: '31 MB', type: 'zip' },
      ],
    });
    showToast('Đã điền dữ liệu mẫu (demo quy trình thực)!', 'success');
  };

  const handleMockUpload = (field) => {
    const extensions = { storyboardFiles: ['pdf', 'jpg'], manuscriptFiles: ['zip', 'tif', 'jpg'] };
    const ext = extensions[field][Math.floor(Math.random() * extensions[field].length)];
    const names = {
      storyboardFiles: [`Ch_Storyboard_p${formData.storyboardFiles.length + 1}.${ext}`],
      manuscriptFiles: [`Ch_Pages_${formData.manuscriptFiles.length * 5 + 1}-${(formData.manuscriptFiles.length + 1) * 5}.${ext}`],
    };
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], { name: names[field][0], size: `${Math.floor(Math.random() * 30) + 5} MB`, type: ext }],
    }));
  };

  const removeFile = (field, index) => {
    setFormData(prev => {
      const newFiles = [...prev[field]];
      newFiles.splice(index, 1);
      return { ...prev, [field]: newFiles };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};

    if (!formData.seriesId) errs.seriesId = 'Vui lòng chọn tác phẩm';
    if (!formData.chapterNo) errs.chapterNo = 'Vui lòng nhập số chương';
    if (!formData.title) errs.title = 'Vui lòng nhập tiêu đề chương';

    // BR-42: Publication date validation
    const dateError = validatePublicationDate(formData.publicationDate);
    if (dateError) errs.publicationDate = dateError;
    if (!formData.publicationDate) errs.publicationDate = 'Vui lòng chọn ngày xuất bản';

    if (formData.manuscriptFiles.length === 0) {
      errs.manuscriptFiles = 'Tối thiểu phải đính kèm 1 file bản thảo';
    }

    // BR-40: Check eligibility
    const selectedSeries = series.find(s => s.id === formData.seriesId);
    if (selectedSeries && !canCreateChapter(user, selectedSeries)) {
      errs.seriesId = 'BR-40: Chỉ Mangaka chủ sở hữu của series đang Active mới được tạo chapter';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Vui lòng kiểm tra lại thông tin.', 'error');
      return;
    }

    addChapter({
      seriesId: formData.seriesId,
      chapterNo: parseInt(formData.chapterNo),
      title: formData.title,
      publicationDate: formData.publicationDate,
      totalPages: parseInt(formData.totalPages),
      synopsis: formData.synopsis,
      notes: formData.notes,
    });

    showToast('✅ Đăng ký chapter mới thành công! Hệ thống đã ghi nhận lịch xuất bản.', 'success');
    navigate('/chapters');
  };

  // Tính deadline từ pub date
  const getDeadline = () => {
    if (!formData.publicationDate) return null;
    const d = new Date(formData.publicationDate);
    d.setDate(d.getDate() - 14);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const FileIcon = ({ type }) => {
    const icons = { pdf: '📄', zip: '🗜️', tif: '🖼️', jpg: '🖼️', png: '🖼️' };
    return <span>{icons[type] || '📎'}</span>;
  };

  const FileList = ({ files, field }) => (
    <div className="space-y-2 mt-3">
      {files.map((file, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 bg-bg-tertiary/60 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <FileIcon type={file.type} />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-text-muted">{file.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <button
              type="button"
              onClick={() => removeFile(field, idx)}
              className="text-xs text-danger hover:underline"
            >
              Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Back link */}
      <Link to="/chapters" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Quay lại danh sách Chapter
      </Link>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đăng Ký Chapter Mới (P3)</h1>
          <p className="text-sm text-text-secondary mt-1">
            Khai báo thông tin chapter sắp tới để hệ thống lên lịch và phân công công việc
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillSample}
          className="btn btn-ghost border border-primary/30 text-primary text-sm flex items-center gap-2"
        >
          <PenTool size={15} /> Điền Dữ Liệu Mẫu
        </button>
      </div>

      {/* Hướng dẫn quy trình */}
      <div className="glass-card p-4 border border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-text-secondary space-y-1">
            <p className="font-semibold text-cyan-300">Quy trình Mangaka khi bắt đầu chapter mới:</p>
            <p>① Khai báo thông tin cơ bản (số chapter, tiêu đề, ngày ra) → hệ thống tự tính deadline</p>
            <p>② Đính kèm kịch bản/storyboard để Editor nắm trước nội dung</p>
            <p>③ Nộp bản phác thảo (rough/ink) → Mangaka giao task vẽ chi tiết cho Assistant</p>
            <p>④ Ghi chú yêu cầu đặc biệt cho Editor (double-spread, SFX, lettering...)</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Section 1: Thông tin cơ bản ── */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            1. Thông tin cơ bản
          </h2>

          {/* Series */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tác phẩm (Series) <span className="text-danger">*</span>
            </label>
            <select
              className={`form-input ${errors.seriesId ? 'error' : ''}`}
              value={formData.seriesId}
              onChange={e => setFormData(p => ({ ...p, seriesId: e.target.value }))}
            >
              <option value="">Chọn tác phẩm của bạn...</option>
              {activeMangakaSeries.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            {errors.seriesId && <p className="text-xs text-danger mt-1">{errors.seriesId}</p>}
            {activeMangakaSeries.length === 0 && (
              <p className="text-xs text-amber-400 mt-1">⚠ Bạn chưa có series Active nào. Cần được Board duyệt và kích hoạt trước.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Chapter No */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
                <Hash size={13} /> Số chương <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className={`form-input ${errors.chapterNo ? 'error' : ''}`}
                min={1}
                placeholder="VD: 12"
                value={formData.chapterNo}
                onChange={e => setFormData(p => ({ ...p, chapterNo: e.target.value }))}
              />
              {errors.chapterNo && <p className="text-xs text-danger mt-1">{errors.chapterNo}</p>}
            </div>

            {/* Total Pages */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
                <Layers size={13} /> Tổng số trang <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                min={1}
                placeholder="VD: 24"
                value={formData.totalPages}
                onChange={e => setFormData(p => ({ ...p, totalPages: e.target.value }))}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tên chương <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="VD: Sự Thức Tỉnh Của Rồng Thần"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            />
            {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
          </div>

          {/* Publication Date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
              <CalendarDays size={13} /> Ngày xuất bản dự kiến <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-input w-full ${errors.publicationDate ? 'error' : ''}`}
              value={formData.publicationDate}
              onChange={e => setFormData(p => ({ ...p, publicationDate: e.target.value }))}
            />
            {errors.publicationDate && <p className="text-xs text-danger mt-1">{errors.publicationDate}</p>}
            {getDeadline() && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
                <AlertCircle size={12} className="text-amber-400" />
                <span className="text-amber-300">
                  <strong>BR-42:</strong> Deadline nộp bản thảo hoàn chỉnh cho Editor:{' '}
                  <strong>{getDeadline()}</strong> (14 ngày trước ngày xuất bản)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Tóm tắt nội dung ── */}
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            2. Tóm tắt nội dung chương (Synopsis)
          </h2>
          <p className="text-xs text-text-secondary">
            Mô tả ngắn gọn các diễn biến chính trong chương này. Editor sẽ dùng phần này để nắm bắt nội dung trước khi nhận bản thảo hoàn chỉnh.
          </p>
          <textarea
            className="form-input h-28 resize-none"
            placeholder="VD: Ryuu lần đầu giải phóng sức mạnh rồng thần khi đối đầu với hội đồng hắc ám. Bí mật về thanh gươm ánh sáng được hé lộ qua flashback..."
            value={formData.synopsis}
            onChange={e => setFormData(p => ({ ...p, synopsis: e.target.value }))}
          />
          <p className="text-xs text-text-muted text-right">{formData.synopsis.length} ký tự</p>
        </div>

        {/* ── Section 3: Kịch bản / Storyboard ── */}
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <ScrollText size={16} className="text-violet-400" />
            3. Kịch bản / Storyboard
            <span className="text-xs font-normal text-text-muted ml-1">(Tùy chọn — Khuyến khích)</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Bản phác thảo layout các trang (storyboard / nemu) hoặc kịch bản viết tay dạng PDF/ảnh.
            Giúp Editor và Assistant hiểu trước cấu trúc trang truyện.
          </p>

          <div className="p-6 border-2 border-dashed border-violet-500/30 hover:border-violet-500/50 bg-violet-500/5 rounded-xl text-center transition-colors">
            <ScrollText size={28} className="mx-auto mb-2 text-violet-400 opacity-70" />
            <p className="text-sm text-text-secondary">Kéo thả hoặc</p>
            <button
              type="button"
              onClick={() => handleMockUpload('storyboardFiles')}
              className="mt-2 btn btn-ghost border border-violet-500/40 text-violet-400 text-xs py-1.5 px-4"
            >
              Chọn file kịch bản / storyboard
            </button>
            <p className="text-xs text-text-muted mt-2">PDF, JPG, PNG · Tối đa 20MB/file</p>
          </div>

          {formData.storyboardFiles.length > 0 && (
            <FileList files={formData.storyboardFiles} field="storyboardFiles" />
          )}
        </div>

        {/* ── Section 4: Bản thảo Sequential Art ── */}
        <div className={`glass-card p-6 space-y-3 ${errors.manuscriptFiles ? 'border border-danger/40' : 'border border-primary/20'}`}>
          <h2 className="text-base font-bold flex items-center gap-2">
            <ImageIcon size={16} className="text-primary" />
            4. Bản thảo Sequential Art
            <span className="text-xs font-normal text-danger ml-1">* Bắt buộc</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Toàn bộ trang truyện đã phác thảo (pencil) hoặc đã ink xong. Có thể nén thành file ZIP.
            Quy ước đặt tên: <code className="bg-bg-tertiary px-1 py-0.5 rounded text-cyan-400">Chapter12_Page01.jpg</code>
          </p>

          <div className={`p-6 border-2 border-dashed rounded-xl text-center transition-colors ${
            errors.manuscriptFiles
              ? 'border-danger/50 bg-danger/5'
              : 'border-primary/30 hover:border-primary/60 bg-primary/5'
          }`}>
            <Upload size={28} className={`mx-auto mb-2 ${errors.manuscriptFiles ? 'text-danger' : 'text-primary'} opacity-80`} />
            <p className="text-sm text-text-secondary">Kéo thả file bản thảo vào đây hoặc</p>
            <button
              type="button"
              onClick={() => handleMockUpload('manuscriptFiles')}
              className="mt-2 btn btn-primary text-xs py-1.5 px-4"
            >
              Chọn File (Browse)
            </button>
            <p className="text-xs text-text-muted mt-2">ZIP, PDF, JPG, PNG, TIF · Tối đa 50MB/file</p>
          </div>

          {errors.manuscriptFiles && (
            <p className="text-xs text-danger flex items-center gap-1">
              <AlertCircle size={12} /> {errors.manuscriptFiles}
            </p>
          )}

          {formData.manuscriptFiles.length > 0 && (
            <FileList files={formData.manuscriptFiles} field="manuscriptFiles" />
          )}
        </div>

        {/* ── Section 5: Ghi chú cho Editor ── */}
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-400" />
            5. Ghi chú đặc biệt cho Editor
            <span className="text-xs font-normal text-text-muted ml-1">(Tùy chọn)</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Các yêu cầu kỹ thuật hoặc lưu ý đặc biệt: trang đôi (double-spread), SFX font đặc biệt, thứ tự đọc bất thường, v.v.
          </p>
          <textarea
            className="form-input h-24 resize-none"
            placeholder="VD: Trang 12–13 là double-spread, vui lòng không cắt giữa khi dàn trang. Trang 20: lời thoại nhân vật phụ dùng font italic..."
            value={formData.notes}
            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
          />
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-end gap-4 pt-2">
          <button type="button" onClick={() => navigate('/chapters')} className="btn btn-ghost">
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-primary px-8">
            <PlusCircle size={18} /> Đăng Ký Chapter Lên Hệ Thống
          </button>
        </div>
      </form>
    </div>
  );
}
