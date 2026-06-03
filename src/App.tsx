// ============================================================
// App.tsx — 메인 페이지 (전체 레이아웃 + 비즈니스 로직)
// ============================================================
// 역할:
//   1. Supabase에서 지원 목록 불러오기 (fetchAll)
//   2. 상태 필터 카드 렌더링 및 필터 로직
//   3. 지원 목록 테이블 렌더링
//   4. 상태 변경 / 삭제 처리

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Application, ApplicationInsert, Status } from './types';
import { STATUS_LIST, STATUS_COLOR } from './types';
import AddModal from './components/AddModal';
import './App.css';

export default function App() {
  // 전체 지원 목록 (DB에서 불러온 데이터)
  const [applications, setApplications] = useState<Application[]>([]);
  // 초기 로딩 상태 (스켈레톤/스피너 대신 텍스트로 표시)
  const [loading, setLoading] = useState(true);
  // 지원 추가 모달 열림 여부
  const [showModal, setShowModal] = useState(false);
  // 선택된 필터 상태 ('전체'면 필터 없음)
  const [filterStatus, setFilterStatus] = useState<Status | '전체'>('전체');

  // ── DB 조회 ──────────────────────────────────────────────
  // Supabase에서 전체 목록을 지원일 최신순으로 가져온다.
  const fetchAll = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });
    setApplications(data ?? []);
    setLoading(false);
  };

  // 컴포넌트 마운트 시 한 번 실행
  useEffect(() => { fetchAll(); }, []);

  // ── 지원 추가 ────────────────────────────────────────────
  // AddModal에서 폼 제출 시 호출됨 → DB INSERT 후 목록 새로고침
  const handleAdd = async (data: ApplicationInsert) => {
    await supabase.from('applications').insert(data);
    await fetchAll(); // 추가 후 최신 목록 다시 불러오기
  };

  // ── 상태 변경 ────────────────────────────────────────────
  // 테이블 select 변경 시 호출 → DB UPDATE + 로컬 상태도 즉시 반영
  // (fetchAll 없이 로컬만 업데이트해서 깜빡임 방지)
  const handleStatusChange = async (id: string, status: Status) => {
    await supabase.from('applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  // ── 삭제 ─────────────────────────────────────────────────
  // confirm 확인 후 DB DELETE + 로컬 상태에서 즉시 제거
  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('applications').delete().eq('id', id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  // ── 필터 ─────────────────────────────────────────────────
  // filterStatus가 '전체'면 전체 목록, 아니면 해당 상태만 필터링
  const filtered = filterStatus === '전체'
    ? applications
    : applications.filter(a => a.status === filterStatus);

  // 상태 카드에 표시할 상태별 건수
  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  // ── 렌더링 ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>취업 지원 현황</h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>총 {applications.length}개 지원</p>
          </div>
          <button onClick={() => setShowModal(true)} style={addBtnStyle}>+ 지원 추가</button>
        </div>

        {/* ── 상태 필터 카드 ── */}
        {/* 클릭 시 해당 상태만 필터링, 다시 클릭하면 필터 해제 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {STATUS_LIST.map(s => (
            <div
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '전체' : s)}
              style={{
                background: filterStatus === s ? STATUS_COLOR[s] : '#fff',
                color: filterStatus === s ? '#fff' : '#374151',
                border: `2px solid ${STATUS_COLOR[s]}`,
                borderRadius: 10,
                padding: '10px 18px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                userSelect: 'none',
              }}
            >
              {s} {counts[s]}
            </div>
          ))}
          {/* 필터 중일 때만 '필터 해제' 텍스트 표시 */}
          {filterStatus !== '전체' && (
            <div
              onClick={() => setFilterStatus('전체')}
              style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', cursor: 'pointer', fontSize: 13, padding: '0 8px' }}
            >
              ✕ 필터 해제
            </div>
          )}
        </div>

        {/* ── 지원 목록 테이블 ── */}
        {loading ? (
          // 로딩 중
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          // 데이터 없음
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            {filterStatus === '전체' ? '지원 내역이 없습니다. 추가해보세요!' : `${filterStatus} 상태가 없습니다.`}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  {['회사명', '포지션', '플랫폼', '지원일', '상태', '메모', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: app.status === '탈락' ? '#fafafa' : '#fff', // 탈락은 배경색 살짝 다르게
                    }}
                  >
                    {/* 회사명 — 탈락이면 회색으로 */}
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: app.status === '탈락' ? '#9ca3af' : '#111827' }}>
                      {app.company_name}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#374151' }}>{app.position}</td>
                    <td style={{ padding: '12px 14px', color: '#6b7280' }}>{app.platform}</td>
                    <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{app.applied_at}</td>

                    {/* 상태 — select로 바로 변경 가능 */}
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value as Status)}
                        style={{
                          background: STATUS_COLOR[app.status],
                          color: '#fff',
                          border: 'none',
                          borderRadius: 20,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    {/* 메모 — 길면 말줄임표, hover 시 title로 전체 내용 확인 */}
                    <td
                      style={{ padding: '12px 14px', color: '#9ca3af', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={app.notes}
                    >
                      {app.notes}
                    </td>

                    {/* 삭제 버튼 */}
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => handleDelete(app.id)}
                        style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 16 }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 모달은 showModal이 true일 때만 렌더링 */}
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}

// ── 스타일 상수 ──────────────────────────────────────────────
const addBtnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
