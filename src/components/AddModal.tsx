// ============================================================
// components/AddModal.tsx — 지원 추가 모달
// ============================================================
// "+ 지원 추가" 버튼을 클릭하면 열리는 모달 폼.
// 폼 제출 시 부모(App)의 onAdd 함수를 호출하고 모달을 닫는다.

import { useState } from 'react';
import type { ApplicationInsert } from '../types';
import { PLATFORM_LIST, STATUS_LIST } from '../types';

interface Props {
  onClose: () => void;                        // 모달 닫기 함수 (부모에서 전달)
  onAdd: (data: ApplicationInsert) => Promise<void>; // Supabase INSERT 함수 (부모에서 전달)
}

export default function AddModal({ onClose, onAdd }: Props) {
  // 폼 상태 — 각 필드의 기본값 설정
  const [form, setForm] = useState<ApplicationInsert>({
    company_name: '',
    position: '',
    platform: '원티드',
    applied_at: new Date().toISOString().slice(0, 10),
    status: '서류중',
    job_url: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false); // 중복 제출 방지용 로딩 상태

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 필수 필드 빈값 체크 (HTML required가 있지만 방어적으로 추가)
    if (!form.company_name.trim() || !form.position.trim()) return;
    setLoading(true);
    await onAdd(form);   // 부모의 Supabase INSERT 실행
    setLoading(false);
    onClose();           // 성공 후 모달 닫기
  };

  return (
    // 오버레이 클릭 시 모달 닫힘
    <div style={overlay} onClick={onClose}>
      {/* 모달 내부 클릭은 이벤트 버블링 방지 */}
      <div style={modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>지원 추가</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 회사명 */}
          <label style={labelStyle}>
            회사명 *
            <input
              style={inputStyle}
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="예: 카카오"
              required
            />
          </label>

          {/* 포지션 */}
          <label style={labelStyle}>
            포지션 *
            <input
              style={inputStyle}
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              placeholder="예: 백엔드 개발자"
              required
            />
          </label>

          {/* 플랫폼 */}
          <label style={labelStyle}>
            플랫폼
            <select
              style={inputStyle}
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
            >
              {PLATFORM_LIST.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>

          {/* 지원 날짜 */}
          <label style={labelStyle}>
            지원 날짜
            <input
              type="date"
              style={inputStyle}
              value={form.applied_at}
              onChange={e => setForm(f => ({ ...f, applied_at: e.target.value }))}
            />
          </label>

          {/* 상태 */}
          <label style={labelStyle}>
            상태
            <select
              style={inputStyle}
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
            >
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>

          {/* 공고 URL (선택) */}
          <label style={labelStyle}>
            공고 URL
            <input
              style={inputStyle}
              value={form.job_url}
              onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))}
              placeholder="https://www.wanted.co.kr/..."
            />
          </label>

          {/* 메모 (선택) */}
          <label style={labelStyle}>
            메모
            <textarea
              style={{ ...inputStyle, height: 72, resize: 'vertical' }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="공고 링크, 담당자 이름, 전형 일정 등 자유롭게"
            />
          </label>

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={cancelBtn}>취소</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? '저장 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 스타일 상수 ──────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100,
};
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 28,
  width: '100%', maxWidth: 440,
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};
const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
  fontSize: 14, color: '#374151', fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  border: '1px solid #d1d5db', borderRadius: 6,
  padding: '8px 10px', fontSize: 14, outline: 'none',
};
const cancelBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 6,
  border: '1px solid #d1d5db', background: '#fff',
  cursor: 'pointer', fontSize: 14,
};
const submitBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 6,
  border: 'none', background: '#6366f1',
  color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};
