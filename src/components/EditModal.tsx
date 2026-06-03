// ============================================================
// components/EditModal.tsx — 지원 내역 수정 모달
// ============================================================
// 테이블 행 클릭 시 열림. 기존 데이터가 폼에 미리 채워져 있음.

import { useState } from 'react';
import type { Application } from '../types';
import { PLATFORM_LIST, STATUS_LIST } from '../types';

interface Props {
  application: Application;                              // 수정할 기존 데이터
  onClose: () => void;
  onEdit: (id: string, data: Partial<Application>) => Promise<void>;
}

export default function EditModal({ application, onClose, onEdit }: Props) {
  // 기존 데이터로 폼 초기값 설정
  const [form, setForm] = useState({
    company_name: application.company_name,
    position: application.position,
    platform: application.platform,
    applied_at: application.applied_at,
    status: application.status,
    job_url: application.job_url ?? '',
    interview_at: application.interview_at ?? '',
    notes: application.notes,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.position.trim()) return;
    setLoading(true);
    await onEdit(application.id, form);
    setLoading(false);
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>지원 내역 수정</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <label style={labelStyle}>
            회사명 *
            <input style={inputStyle} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} required />
          </label>

          <label style={labelStyle}>
            포지션 *
            <input style={inputStyle} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} required />
          </label>

          <label style={labelStyle}>
            플랫폼
            <select style={inputStyle} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
              {PLATFORM_LIST.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            지원 날짜
            <input type="date" style={inputStyle} value={form.applied_at} onChange={e => setForm(f => ({ ...f, applied_at: e.target.value }))} />
          </label>

          <label style={labelStyle}>
            상태
            <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            공고 URL
            <input style={inputStyle} value={form.job_url} onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))} placeholder="https://www.wanted.co.kr/..." />
          </label>

          <label style={labelStyle}>
            면접 날짜
            <input type="date" style={inputStyle} value={form.interview_at} onChange={e => setForm(f => ({ ...f, interview_at: e.target.value }))} />
          </label>

          <label style={labelStyle}>
            메모
            <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="담당자 이름, 전형 일정 등" />
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={cancelBtn}>취소</button>
            <button type="submit" disabled={loading} style={submitBtn}>{loading ? '저장 중...' : '수정 완료'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, color: '#374151', fontWeight: 500 };
const inputStyle: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 10px', fontSize: 14, outline: 'none' };
const cancelBtn: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 };
const submitBtn: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
