// ============================================================
// Login.tsx — 간단한 비밀번호 보호 화면
// ============================================================

import { useState } from 'react';

interface Props {
  onSuccess: () => void;
}

// 비밀번호는 여기서 변경
const PASSWORD = 'jjw0818';

export default function Login({ onSuccess }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      // 세션에 저장 — 브라우저 탭 닫으면 초기화
      sessionStorage.setItem('auth', 'ok');
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setInput('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        width: '100%',
        maxWidth: 360,
        boxShadow: 'var(--shadow-lg)',
        animation: shake ? 'shake 0.5s' : 'none',
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--accent)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>취업 지원 현황</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-3)' }}>비밀번호를 입력해주세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="비밀번호"
            autoFocus
            style={{
              border: `1.5px solid ${error ? '#ef4444' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '11px 14px',
              fontSize: 15,
              outline: 'none',
              background: 'var(--bg)',
              color: 'var(--text-1)',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
          />
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>
              비밀번호가 틀렸습니다
            </p>
          )}
          <button
            type="submit"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '11px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 4,
              boxShadow: '0 2px 8px rgba(201,100,66,0.3)',
            }}
          >
            입력
          </button>
        </form>
      </div>

      {/* shake 애니메이션 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
