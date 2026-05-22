import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRankingStore } from '../../store/rankingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../utils/toast';

import { validateVoteRecord, validateVoteRecordUniqueness } from '../../utils/validators';
import { canEnterVoteData } from '../../utils/permissions';
import { formatDate } from '../../utils/calculations';
import {
  ClipboardList, Plus, CheckCircle2, Clock, BarChart3,
  ArrowRight, AlertCircle, Hash, Users, ThumbsUp
} from 'lucide-react';

export default function VoteEntryPage() {
  const user = useAuthStore(s => s.currentUser);
  const { series } = useSeriesStore();
  const { voteRecords, addVoteRecord, confirmRecord, getPeriods } = useRankingStore();

  const activeSeries = series.filter(s => s.status === 'Active');
  const canEnter = canEnterVoteData(user);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ seriesId: '', period: '', readerCount: '', voteCount: '' });
  const [errors, setErrors] = useState({});

  const pendingRecords = voteRecords.filter(r => r.status === 'Pending');
  const confirmedRecords = voteRecords.filter(r => r.status === 'Confirmed');

  const getSeriesTitle = (id) => series.find(s => s.id === id)?.title || id;

  const handleFillSample = () => {
    if (activeSeries.length === 0) {
      showToast('Không có series Active để nhập liệu.', 'error');
      return;
    }
    // Chọn series chưa có record pending/confirmed trong kỳ này
    const samplePeriod = '2026-Q2';
    const takenIds = voteRecords.filter(r => r.period === samplePeriod).map(r => r.seriesId);
    const available = activeSeries.find(s => !takenIds.includes(s.id));
    if (!available) {
      showToast('Tất cả series đã có dữ liệu cho kỳ 2026-Q2, hãy thử kỳ khác.', 'warning');
      setForm({ seriesId: activeSeries[0].id, period: '2026-Q3', readerCount: '18500', voteCount: '4200' });
      setShowForm(true);
      return;
    }
    setForm({
      seriesId: available.id,
      period: samplePeriod,
      readerCount: '22000',
      voteCount: '5800',
    });
    setErrors({});
    setShowForm(true);
    showToast('Đã điền dữ liệu mẫu!', 'success');
  };

  const handleSubmit = () => {
    const record = {
      ...form,
      readerCount: parseInt(form.readerCount),
      voteCount: parseInt(form.voteCount),
      enteredBy: user.id,
    };

    const errs = validateVoteRecord(record);
    const uniqueErr = validateVoteRecordUniqueness(record.seriesId, record.period, voteRecords);
    if (uniqueErr) errs.seriesId = uniqueErr;
    if (!record.seriesId) errs.seriesId = 'Vui lòng chọn series';
    if (!record.period) errs.period = 'Vui lòng nhập kỳ báo cáo (ví dụ: 2026-Q1)';

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    addVoteRecord(record);
    setForm({ seriesId: '', period: form.period, readerCount: '', voteCount: '' });
    setErrors({});
    setShowForm(false);
    showToast('Đã thêm VoteRecord — đang chờ xác nhận (BR-88)', 'success');
  };

  const handleConfirm = (recordId) => {
    confirmRecord(recordId);
    showToast('✅ Đã xác nhận — Bảng ranking được recalculate ngay (BR-92)!', 'success');
  };

  if (!canEnter) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertCircle size={48} className="text-amber-400" />
        <h2 className="text-xl font-bold">Không có quyền truy cập</h2>
        <p className="text-text-secondary text-sm">BR-87: Chỉ thành viên Editorial Board mới có thể nhập dữ liệu vote.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList size={22} className="text-primary" />
            Nhập Dữ Liệu Vote Độc Giả
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            BR-87: Chỉ Board member · BR-88: Mỗi series/kỳ chỉ 1 record · BR-89: voteCount ≤ readerCount
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleFillSample} className="btn btn-ghost border border-primary/30 text-primary text-sm">
            Điền Mẫu Demo
          </button>
          <button onClick={() => { setShowForm(!showForm); setErrors({}); }} className="btn btn-primary">
            <Plus size={16} /> Thêm VoteRecord
          </button>
        </div>
      </div>

      {/* Flow explanation */}
      <div className="glass-card p-4 flex items-center gap-4 text-sm text-text-secondary">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Hash size={14} /> Nhập dữ liệu
        </div>
        <ArrowRight size={14} className="text-text-muted" />
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <Clock size={14} /> Pending (chờ xác nhận)
        </div>
        <ArrowRight size={14} className="text-text-muted" />
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <CheckCircle2 size={14} /> Confirmed → Ranking tự cập nhật (BR-92)
        </div>
        <Link to="/ranking" className="ml-auto flex items-center gap-1 text-primary hover:underline text-xs">
          <BarChart3 size={13} /> Xem bảng Ranking →
        </Link>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="glass-card p-6 border border-primary/30 space-y-5">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Plus size={16} className="text-primary" /> Thêm VoteRecord mới
          </h2>
          <div className="grid grid-cols-2 gap-5">
            {/* Series */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Tác phẩm (Series) <span className="text-danger">*</span>
              </label>
              <select
                className={`form-input ${errors.seriesId ? 'error' : ''}`}
                value={form.seriesId}
                onChange={e => setForm(p => ({ ...p, seriesId: e.target.value }))}
              >
                <option value="">Chọn series Active...</option>
                {activeSeries.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              {errors.seriesId && <p className="text-xs text-danger mt-1">{errors.seriesId}</p>}
              <p className="text-xs text-text-muted mt-1">BR-88: Mỗi series chỉ được nhập 1 lần/kỳ</p>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Kỳ báo cáo <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: 2026-Q2"
                className={`form-input ${errors.period ? 'error' : ''}`}
                value={form.period}
                onChange={e => setForm(p => ({ ...p, period: e.target.value }))}
              />
              {errors.period && <p className="text-xs text-danger mt-1">{errors.period}</p>}
            </div>

            {/* Reader Count */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
                <Users size={13} /> Số lượt đọc (readerCount) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="VD: 25000"
                className={`form-input ${errors.readerCount ? 'error' : ''}`}
                value={form.readerCount}
                onChange={e => setForm(p => ({ ...p, readerCount: e.target.value }))}
              />
              {errors.readerCount && <p className="text-xs text-danger mt-1">{errors.readerCount}</p>}
              <p className="text-xs text-text-muted mt-1">BR-89: ≥ 0</p>
            </div>

            {/* Vote Count */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
                <ThumbsUp size={13} /> Số phiếu bình chọn (voteCount) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="VD: 6000"
                className={`form-input ${errors.voteCount ? 'error' : ''}`}
                value={form.voteCount}
                onChange={e => setForm(p => ({ ...p, voteCount: e.target.value }))}
              />
              {errors.voteCount && <p className="text-xs text-danger mt-1">{errors.voteCount}</p>}
              <p className="text-xs text-text-muted mt-1">BR-89: ≤ readerCount</p>
            </div>

            {/* Preview score */}
            {form.readerCount && form.voteCount && parseInt(form.readerCount) > 0 && (
              <div className="col-span-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <span className="text-text-secondary">Điểm dự kiến (BR-90): </span>
                <span className="font-bold text-primary">
                  {((parseInt(form.voteCount) / parseInt(form.readerCount)) * 100).toFixed(2)}%
                </span>
                <span className="text-xs text-text-muted ml-2">
                  = {form.voteCount} / {form.readerCount} × 100
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setErrors({}); }} className="btn btn-ghost">Hủy</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              <Plus size={16} /> Thêm vào danh sách chờ
            </button>
          </div>
        </div>
      )}

      {/* Pending Records */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Clock size={16} className="text-amber-400" />
          <h2 className="font-bold text-sm">Chờ Xác Nhận — Pending ({pendingRecords.length})</h2>
          <span className="text-xs text-text-muted ml-auto">Nhấn "Xác nhận" → Ranking tự cập nhật (BR-92)</span>
        </div>
        {pendingRecords.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">Không có record nào chờ xác nhận</div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Series</th>
                <th>Kỳ</th>
                <th>Lượt đọc</th>
                <th>Phiếu bầu</th>
                <th>Điểm (BR-90)</th>
                <th>Nhập lúc</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingRecords.map(r => {
                const score = r.readerCount > 0 ? ((r.voteCount / r.readerCount) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{getSeriesTitle(r.seriesId)}</td>
                    <td>
                      <span className="badge bg-primary/20 text-primary">{r.period}</span>
                    </td>
                    <td>{r.readerCount?.toLocaleString('vi-VN')}</td>
                    <td>{r.voteCount?.toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={`font-bold ${parseFloat(score) >= 70 ? 'text-emerald-400' : parseFloat(score) >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {score}%
                      </span>
                    </td>
                    <td className="text-text-muted text-xs">{formatDate(r.enteredAt)}</td>
                    <td>
                      <button
                        onClick={() => handleConfirm(r.id)}
                        className="btn btn-success text-xs py-1 px-3 flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Xác nhận (BR-92)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmed Records */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <h2 className="font-bold text-sm">Đã Xác Nhận — Confirmed ({confirmedRecords.length})</h2>
        </div>
        {confirmedRecords.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">Chưa có record nào được xác nhận</div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Series</th>
                <th>Kỳ</th>
                <th>Lượt đọc</th>
                <th>Phiếu bầu</th>
                <th>Điểm (BR-90)</th>
                <th>Xác nhận lúc</th>
              </tr>
            </thead>
            <tbody>
              {confirmedRecords.map(r => {
                const score = r.readerCount > 0 ? ((r.voteCount / r.readerCount) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{getSeriesTitle(r.seriesId)}</td>
                    <td>
                      <span className="badge bg-primary/20 text-primary">{r.period}</span>
                    </td>
                    <td>{r.readerCount?.toLocaleString('vi-VN')}</td>
                    <td>{r.voteCount?.toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={`font-bold ${parseFloat(score) >= 70 ? 'text-emerald-400' : parseFloat(score) >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {score}%
                      </span>
                    </td>
                    <td className="text-text-muted text-xs">{formatDate(r.confirmedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* BR Info */}
      <div className="glass-card p-4 text-xs text-text-muted">
        <strong>BRs enforced:</strong> BR-87 (Chỉ Board member nhập) · BR-88 (Unique series+period) · BR-89 (voteCount ≤ readerCount, cả hai ≥ 0) · BR-90 (score = voteCount/readerCount × 100%) · BR-92 (Confirm → auto-recalculate ranking)
      </div>
    </div>
  );
}
