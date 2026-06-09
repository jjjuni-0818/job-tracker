// ============================================================
// StatsChart.tsx — 통계 차트 (SVG + CSS, 외부 라이브러리 없음)
// 1. 상태별 도넛 차트
// 2. 월별 지원 수 막대그래프
// 3. 플랫폼별 막대그래프
// ============================================================

import type { Application } from '../types';
import { STATUS_LIST, STATUS_COLOR } from '../types';

interface Props {
  applications: Application[];
}

export default function StatsChart({ applications }: Props) {
  if (applications.length === 0) return null;

  // ── 1. 상태별 카운트 ──────────────────────────────────────
  const statusCounts = STATUS_LIST.map(s => ({
    label: s,
    count: applications.filter(a => a.status === s).length,
    color: STATUS_COLOR[s].bg,
  })).filter(s => s.count > 0);

  // ── 2. 월별 지원 수 (최근 6개월) ─────────────────────────
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}월`,
      count: 0,
    };
  });
  applications.forEach(a => {
    const ym = a.applied_at.slice(0, 7);
    const m = months.find(m => m.key === ym);
    if (m) m.count++;
  });
  const maxMonthCount = Math.max(...months.map(m => m.count), 1);

  // ── 3. 플랫폼별 카운트 ───────────────────────────────────
  const platformMap: Record<string, number> = {};
  applications.forEach(a => {
    platformMap[a.platform] = (platformMap[a.platform] ?? 0) + 1;
  });
  const platforms = Object.entries(platformMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const maxPlatformCount = Math.max(...platforms.map(p => p.count), 1);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr 1fr',
      gap: 12,
      marginBottom: 24,
    }}>

      {/* ── 도넛 차트 ── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>상태 비율</div>
        <DonutChart data={statusCounts} total={applications.length} />
        {/* 범례 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
          {statusCounts.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)', flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 월별 막대그래프 ── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>월별 지원 수</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, marginTop: 8 }}>
          {months.map(m => (
            <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>
                {m.count > 0 ? m.count : ''}
              </span>
              <div style={{
                width: '100%',
                height: m.count === 0 ? 3 : Math.max((m.count / maxMonthCount) * 80, 6),
                background: m.count === 0 ? 'var(--border)' : 'var(--accent)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                opacity: m.count === 0 ? 0.4 : 1,
              }} />
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{applications.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>총 지원</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
              {months[months.length - 1].count}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>이번 달</div>
          </div>
        </div>
      </div>

      {/* ── 플랫폼별 막대그래프 ── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>플랫폼별</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {platforms.map(p => (
            <div key={p.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{p.count}</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(p.count / maxPlatformCount) * 100}%`,
                  background: 'var(--purple)',
                  borderRadius: 99,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── 도넛 차트 SVG 컴포넌트 ───────────────────────────────────
function DonutChart({ data, total }: { data: { label: string; count: number; color: string }[]; total: number }) {
  const size = 100;
  const cx = size / 2;
  const cy = size / 2;
  const r = 36;
  const circumference = 2 * Math.PI * r; // 원 둘레

  // 각 조각의 시작 offset 계산
  let offset = 0;
  const slices = data.map(d => {
    const ratio = d.count / total;
    const dash = ratio * circumference;
    const gap = circumference - dash;
    const startOffset = circumference - offset;
    offset += dash;
    return { ...d, dash, gap, startOffset };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 원 */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={12} />
        {/* 각 조각 */}
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={12}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.startOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        {/* 가운데 텍스트 */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text-1)">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--text-3)">총 지원</text>
      </svg>
    </div>
  );
}

// ── 공통 카드 스타일 ─────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
  boxShadow: 'var(--shadow-sm)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-3)',
  letterSpacing: '0.04em',
  marginBottom: 4,
};
