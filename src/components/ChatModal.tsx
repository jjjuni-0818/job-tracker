// ============================================================
// components/ChatModal.tsx — 공고 기반 RAG 채팅 모달
// ============================================================
// 변경: 채팅 기록을 Supabase chat_messages 테이블에 저장
//       모달 열 때 이전 대화 불러오기

import { useState, useEffect } from 'react';
import type { Application } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  application: Application;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const API = 'http://localhost:8000';

export default function ChatModal({ application, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ingested, setIngested] = useState(false);

  // 모달 열릴 때 이전 대화 + 공고 분석 여부 불러오기
  useEffect(() => {
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

  // 공고 URL 크롤링 → 벡터 저장
  const handleIngest = async () => {
    if (!application.job_url) return;
    setIngesting(true);
    try {
      const res = await fetch(`${API}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: application.id, url: application.job_url }),
      });
      if (!res.ok) throw new Error('공고 분석 실패');
      setIngested(true);
      const welcomeMsg = `✅ 공고 분석 완료! "${application.company_name}" 관련 질문을 해보세요.\n\n예시:\n• 이 회사 주요 기술스택이 뭐야?\n• 예상 면접 질문 알려줘\n• 자격요건이 어떻게 돼?`;
      setMessages([{ role: 'ai', content: welcomeMsg }]);
      await saveMessage('ai', welcomeMsg);
    } catch (e) {
      alert('공고 분석에 실패했습니다. URL을 확인해주세요.');
    }
    setIngesting(false);
  };

  // 질문 → LLM 답변 → 저장
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    await saveMessage('user', question);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: application.id, question }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
      await saveMessage('ai', data.answer);
    } catch (e) {
      const errMsg = '오류가 발생했습니다. 서버 상태를 확인해주세요.';
      setMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
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
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
          </div>
        </div>

        {/* 공고 분석 버튼 */}
        {application.job_url && !ingested && (
          <button
            onClick={handleIngest}
            disabled={ingesting}
            style={{ width: '100%', padding: '10px', marginBottom: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            {ingesting ? '공고 분석 중...' : '🔍 공고 분석 시작'}
          </button>
        )}

        {!application.job_url && (
          <div style={{ padding: '10px', marginBottom: 16, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
            ⚠️ 공고 URL이 없습니다. 수정(✏️)에서 URL을 추가해주세요.
          </div>
        )}

        {/* 채팅 영역 */}
        <div style={{ height: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, padding: '4px 0' }}>
          {messages.length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
              공고를 분석하면 질문할 수 있어요!
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? '#6366f1' : '#f3f4f6',
                color: m.role === 'user' ? '#fff' : '#111827',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: '#f3f4f6', color: '#6b7280', fontSize: 14 }}>
                답변 생성 중...
              </div>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend(); }}
            placeholder="예상 면접 질문 알려줘"
            disabled={!ingested}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!ingested || loading}
            style={{ padding: '10px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' };
