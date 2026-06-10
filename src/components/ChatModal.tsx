// ============================================================
// components/ChatModal.tsx — 공고 기반 RAG 채팅 모달
// ============================================================
// 변경: 채팅 기록을 Supabase chat_messages 테이블에 저장
//       모달 열 때 이전 대화 불러오기

import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { Application } from '../types';
import { supabase } from '../lib/supabase';
import { IconClose, IconSend, IconSearch } from './Icons';

interface Props {
  application: Application;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  created_at?: string;
}

// '2026-06-03' 형식으로 날짜 반환
const toDateStr = (iso?: string) => iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10);

// '2026-06-03' → '2026년 6월 3일'
const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
};

const API = 'https://job-tracker-production-d94c.up.railway.app';

export default function ChatModal({ application, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ingested, setIngested] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null); // 채팅 맨 아래 참조

  // 메시지 추가될 때마다 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 모달 열릴 때 이전 대화 + 공고 분석 여부 불러오기
  useEffect(() => {
    // 모델 미리 워밍업 (백그라운드, 결과 무시) — /ingest 버튼 누를 때쯤 준비 완료
    fetch(`${API}/warmup`, { method: 'POST' }).catch(() => {});

    const load = async () => {
      // 이전 채팅 기록 불러오기
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('application_id', application.id)
        .order('created_at', { ascending: true });

      if (msgs && msgs.length > 0) {
        setMessages(msgs as Message[]);
        setIngested(true); // 이전 대화가 있으면 공고 분석 완료 상태로
      }

      // 공고 분석 여부 확인 (job_documents 테이블)
      const { data: doc } = await supabase
        .from('job_documents')
        .select('id')
        .eq('application_id', application.id)
        .limit(1);

      if (doc && doc.length > 0) setIngested(true);
    };
    load();
  }, [application.id]);

  // 채팅 메시지 Supabase에 저장
  const saveMessage = async (role: 'user' | 'ai', content: string) => {
    await supabase.from('chat_messages').insert({
      application_id: application.id,
      role,
      content,
    });
  };

  // 공고 URL 크롤링 → 벡터 저장 → 검증
  const handleIngest = async () => {
    if (!application.job_url) return;
    setIngesting(true);
    try {
      const res = await fetch(`${API}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: application.id,
          url: application.job_url,
          company_name: application.company_name,  // 검증용
          position: application.position,           // 검증용
        }),
      });
      if (!res.ok) throw new Error('공고 분석 실패');
      const data = await res.json();
      setIngested(true);

      // 검증 결과에 따라 메시지 다르게
      let welcomeMsg = '';
      if (data.warning) {
        // 경고 — URL이 다른 공고일 수 있음
        welcomeMsg = `⚠️ 주의: ${data.warning}\n\n그래도 계속 질문할 수 있지만, 공고 URL을 한번 확인해보세요.\n\n예시:\n• 이 공고 회사명이 뭐야?\n• 어떤 포지션을 모집해?`;
      } else {
        // 정상
        welcomeMsg = `공고 분석 완료! "${application.company_name}" 관련 질문을 해보세요.\n\n예시:\n• 이 회사 주요 기술스택이 뭐야?\n• 예상 면접 질문 알려줘\n• 자격요건이 어떻게 돼?`;
      }
      setMessages([{ role: 'ai', content: welcomeMsg, created_at: new Date().toISOString() }]);
      await saveMessage('ai', welcomeMsg);
    } catch (e) {
      alert('공고 분석에 실패했습니다. URL을 확인해주세요.');
    }
    setIngesting(false);
  };

  // 질문 → LLM 스트리밍 답변 → 저장
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    const now = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'user', content: question, created_at: now }]);
    await saveMessage('user', question);
    setLoading(true);

    // AI 버블 미리 추가 (스트리밍 텍스트 받으면서 업데이트)
    const aiCreatedAt = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'ai', content: '', created_at: aiCreatedAt }]);

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: application.id,
          question,
          company_name: application.company_name,
          position: application.position,
          status: application.status,
        }),
      });

      if (!res.ok || !res.body) throw new Error('서버 오류');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullAnswer += chunk;
        // flushSync: React 18 자동 배칭 우회 → 청크마다 즉시 렌더링
        flushSync(() => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'ai', content: fullAnswer, created_at: aiCreatedAt };
            return updated;
          });
        });
      }

      await saveMessage('ai', fullAnswer);
    } catch (e) {
      const errMsg = '오류가 발생했습니다. 서버 상태를 확인해주세요.';
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', content: errMsg };
        return updated;
      });
    }
    setLoading(false);
  };

  // 대화 초기화
  const handleClear = async () => {
    if (!confirm('대화 기록을 삭제하시겠습니까?')) return;
    await supabase.from('chat_messages').delete().eq('application_id', application.id);
    setMessages([]);
    setIngested(false);
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{application.company_name}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{application.position}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {messages.length > 0 && (
              <button onClick={handleClear} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', cursor: 'pointer' }}>
                대화 초기화
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}><IconClose size={18} /></button>
          </div>
        </div>

        {/* 공고 분석 버튼 */}
        {application.job_url && !ingested && (
          <button
            onClick={handleIngest}
            disabled={ingesting}
            style={{ width: '100%', padding: '10px', marginBottom: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <IconSearch size={14} color="#fff" />
              {ingesting ? '공고 분석 중...' : '공고 분석 시작'}
            </span>
          </button>
        )}

        {!application.job_url && (
          <div style={{ padding: '10px', marginBottom: 16, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
            ⚠️ 공고 URL이 없습니다. 수정(✏️)에서 URL을 추가해주세요.
          </div>
        )}

        {/* 채팅 영역 */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, padding: '4px 2px' }}>
          {messages.length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
              공고를 분석하면 질문할 수 있어요!
            </div>
          )}
          {messages.map((m, i) => {
            // 이전 메시지와 날짜가 다르면 날짜 구분선 표시
            const currDate = toDateStr(m.created_at);
            const prevDate = i > 0 ? toDateStr(messages[i - 1].created_at) : null;
            const showDateDivider = currDate !== prevDate;

            return (
              <div key={i}>
                {/* 날짜 구분선 */}
                {showDateDivider && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {formatDate(currDate)}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  </div>
                )}
                {/* 메시지 버블 */}
                <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                    color: m.role === 'user' ? '#fff' : 'var(--text-1)',
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left',  // 항상 왼쪽 정렬
                    wordBreak: 'keep-all',
                  }}>
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
          {/* 스트리밍 시작 전에만 표시 (AI 버블 비어있을 때) */}
          {loading && messages[messages.length - 1]?.content === '' && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: '#f3f4f6', color: '#6b7280', fontSize: 14 }}>
                답변 생성 중...
              </div>
            </div>
          )}
          {/* 스크롤 앵커 — 새 메시지 올 때 여기로 이동 */}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend(); }}
            placeholder="예상 면접 질문 알려줘"
            disabled={!ingested}
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', background: 'var(--bg)', color: 'var(--text-1)', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleSend}
            disabled={!ingested || loading}
            style={{ padding: '10px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            <IconSend size={15} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(26,21,18,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)', padding: '20px' };
const modal: React.CSSProperties = { background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 600, height: '80vh', maxHeight: 720, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' };
