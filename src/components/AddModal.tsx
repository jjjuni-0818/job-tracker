import { useState } from 'react';
import type { ApplicationInsert } from '../types';
import { PLATFORM_LIST, STATUS_LIST } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (data: ApplicationInsert) => Promise<void>;
}

export default function AddModal({ onClose, onAdd }: Props) {
  const [form, setForm] = useState<ApplicationInsert>({
    company_name: '',
    position: '',
    platform: '원티드',
    applied_at: new Date().toISOString().slice(0, 10),
    status: '서류중',
    job_url: '',
    interview_at: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.position.trim()) return;
    setLoading(true);
    await onAdd(form);
    setLoading(false);
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>지원 추가</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>새로운 지원 내역을 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              회사명 *
              <input style={inputStyle} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="예: 카카오" required />
            </label>
            <label style={labelStyle}>
              포지션 *
              <input style={inputStyle} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="예: 백엔드 개발자" required />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              플랫폼
              <select style={inputStyle} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                {PLATFORM_LIST.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              상태
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              지원 날짜
              <input type="date" style={inputStyle} value={form.applied_at} onChange={e => setForm(f => ({ ...f, applied_at: e.target.value }))} />
            </label>
            <label style={labelStyle}>
              면접 날짜
              <input type="date" style={inputStyle} value={form.interview_at} onChange={e => setForm(f => ({ ...f, interview_at: e.target.value }))} />
            </label>
          </div>

          <label style={labelStyle}>
            공고 URL
            <input style={inputStyle} value={form.job_url} onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))} placeholder="https://www.wanted.co.kr/..." />
          </label>

          <label style={labelStyle}>
            메모
            <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="공고 링크, 담당자, 전형 일정 등" />
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={cancelBtn}>취소</button>
            <button type="submit" disabled={loading} style={submitBtn}>{loading ? '저장 중...' : '추가하기'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(26,21,18,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' };
const modal: React.CSSProperties = { background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: 'var(--text-2)', fontWeight: 500 };
const inputStyle: React.CSSProperties = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 14, outline: 'none', background: 'var(--bg)', color: 'var(--text-1)', transition: 'border-color 0.15s', fontFamily: 'inherit' };
const cancelBtn: React.CSSProperties = { padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13, fontWeight: 500 };
const submitBtn: React.CSSProperties = { padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(201,100,66,0.3)' };
