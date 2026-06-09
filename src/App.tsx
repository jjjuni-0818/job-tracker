import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Application, ApplicationInsert, Status } from './types';
import { STATUS_LIST, STATUS_COLOR } from './types';

import AddModal from './components/AddModal';
import EditModal from './components/EditModal';
import ChatModal from './components/ChatModal';
import StatsChart from './components/StatsChart';
import { IconTarget, IconPlus, IconEdit, IconTrash, IconChat, IconLink, IconClipboard } from './components/Icons';
import './App.css';

export default function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Application | null>(null);
  const [chatTarget, setChatTarget] = useState<Application | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('전체');
  const [filterStatus, setFilterStatus] = useState<Status | '전체'>('전체');

  const fetchAll = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });
    setApplications(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async (data: ApplicationInsert) => {
    // date 타입 컬럼은 빈 문자열 대신 null로 변환
    const cleaned = {
      ...data,
      interview_at: data.interview_at || null,
    };
    const { error } = await supabase.from('applications').insert(cleaned);
    if (error) { alert('저장 실패: ' + error.message); return; }
    await fetchAll();
  };

  const handleEdit = async (id: string, data: Partial<Application>) => {
    // date 타입 컬럼은 빈 문자열 대신 null로 변환
    const cleaned = {
      ...data,
      interview_at: data.interview_at || null,
    };
    await supabase.from('applications').update(cleaned).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...cleaned } : a));
  };

  const handleStatusChange = async (id: string, status: Status) => {
    await supabase.from('applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('applications').delete().eq('id', id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  const platforms = ['전체', ...Array.from(new Set(applications.map(a => a.platform)))];
  const platformFiltered = filterPlatform === '전체' ? applications : applications.filter(a => a.platform === filterPlatform);
  const filtered = filterStatus === '전체' ? platformFiltered : platformFiltered.filter(a => a.status === filterStatus);
  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = platformFiltered.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* 헤더 */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTarget size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>취업 지원 현황</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>
              총 {applications.length}개
            </span>
          </div>
          <button onClick={() => setShowModal(true)} style={addBtnStyle}>
            <IconPlus size={14} color="#fff" style={{ marginRight: 6 }} />
          지원 추가
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {STATUS_LIST.map(s => {
            const isActive = filterStatus === s;
            const c = STATUS_COLOR[s];
            return (
              <div
                key={s}
                onClick={() => { setFilterStatus(isActive ? '전체' : s); }}
                style={{
                  background: isActive ? c.bg : 'var(--surface)',
                  border: `1.5px solid ${isActive ? c.bg : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? `0 4px 12px ${c.bg}40` : 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-1)', lineHeight: 1 }}>
                  {counts[s]}
                </div>
                <div style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-2)', marginTop: 4 }}>
                  {s}
                </div>
              </div>
            );
          })}
        </div>

        {/* 통계 차트 */}
        <StatsChart applications={applications} />

        {/* 플랫폼 탭 */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
          {platforms.map(p => {
            const isActive = filterPlatform === p;
            const count = p === '전체' ? applications.length : applications.filter(a => a.platform === p).length;
            return (
              <button
                key={p}
                onClick={() => { setFilterPlatform(p); setFilterStatus('전체'); }}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {p} <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)', fontSize: 12 }}>{count}</span>
              </button>
            );
          })}
          {filterStatus !== '전체' && (
            <button
              onClick={() => setFilterStatus('전체')}
              style={{ padding: '6px 10px', border: 'none', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}
            >
              ✕ 필터 해제
            </button>
          )}
        </div>

        {/* 테이블 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ marginBottom: 12, opacity: 0.3 }}><IconClipboard size={36} color="var(--text-2)" /></div>
            <div style={{ color: 'var(--text-3)', fontSize: 14 }}>
              {filterStatus === '전체' ? '지원 내역이 없습니다.' : `${filterStatus} 상태가 없습니다.`}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['회사명', '포지션', '플랫폼', '지원일', '면접일', '상태', '공고', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.04em', background: 'var(--surface-2)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => {
                  const isDead = app.status === '탈락';
                  const c = STATUS_COLOR[app.status];
                  return (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                        opacity: isDead ? 0.55 : 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>
                        {app.company_name}
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-2)', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.position}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                          {app.platform}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {app.applied_at}
                      </td>
                      <td style={{ padding: '13px 16px', color: app.interview_at ? 'var(--accent)' : 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap', fontWeight: app.interview_at ? 600 : 400 }}>
                        {app.interview_at || '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <select
                          value={app.status}
                          onChange={e => handleStatusChange(app.id, e.target.value as Status)}
                          style={{
                            background: c.soft,
                            color: c.bg,
                            border: `1.5px solid ${c.bg}40`,
                            borderRadius: 99,
                            padding: '3px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {app.job_url ? (
                          <a href={app.job_url} target="_blank" rel="noreferrer" title={app.job_url} style={{ color: 'var(--purple)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            <IconLink size={12} color="var(--purple)" />
                          </a>
                        ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button onClick={() => setChatTarget(app)} title="AI 면접 준비" style={iconBtn}><IconChat color="var(--purple)" /></button>
                          <button onClick={() => setEditTarget(app)} title="수정" style={iconBtn}><IconEdit color="var(--text-3)" /></button>
                          <button onClick={() => handleDelete(app.id)} title="삭제" style={iconBtn}><IconTrash color="var(--text-3)" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
      {editTarget && <EditModal application={editTarget} onClose={() => setEditTarget(null)} onEdit={handleEdit} />}
      {chatTarget && <ChatModal application={chatTarget} onClose={() => setChatTarget(null)} />}
    </div>
  );
}

const addBtnStyle: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(201,100,66,0.3)',
  transition: 'opacity 0.15s',
};

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '4px 6px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  opacity: 0.5,
  transition: 'opacity 0.15s',
};
