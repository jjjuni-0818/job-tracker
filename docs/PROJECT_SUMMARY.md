# 취업 지원 현황 트래커 — 전체 정리

작성일: 2026-06-03  
작성자: 정주원

---

## 1. 전체 구조 한눈에 보기

```
[사용자 브라우저]
       │
       ▼
[React 프론트엔드] ──── Supabase DB (PostgreSQL)
  localhost:5173        - applications (지원 목록)
  or GitHub Pages       - chat_messages (채팅 기록)
       │                - job_documents (공고 벡터)
       │
       ▼ (AI 채팅 기능만)
[FastAPI 백엔드]
  localhost:8000
       │
       ├── 공고 URL 크롤링 (BeautifulSoup)
       ├── 벡터 임베딩 (HuggingFace)
       └── LLM 답변 (Groq API - llama3)
```

---

## 2. 기술 스택

| 역할 | 기술 | 설명 |
|------|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite | UI |
| 데이터베이스 | Supabase (PostgreSQL) | 지원 목록, 채팅 기록 저장 |
| 벡터 DB | Supabase pgvector | 공고 임베딩 저장 |
| 백엔드 | FastAPI (Python) | RAG API 서버 |
| 크롤링 | BeautifulSoup | 공고 URL 텍스트 추출 |
| 임베딩 | HuggingFace sentence-transformers | 텍스트 → 벡터 변환 (무료) |
| LLM | Groq API (llama-3.1-8b-instant) | AI 답변 생성 (무료) |
| 배포 | GitHub Pages + GitHub Actions | 자동 배포 |

---

## 3. Supabase DB 테이블 구조

### applications (지원 목록)
```sql
create table applications (
  id           uuid        primary key default gen_random_uuid(),
  company_name text        not null,
  position     text        not null,
  platform     text        not null default '원티드',
  applied_at   date        not null,
  status       text        not null default '서류중',
  job_url      text        default '',   -- 나중에 추가한 컬럼
  notes        text        default '',
  created_at   timestamptz default now()
);
```

### chat_messages (채팅 기록)
```sql
create table chat_messages (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        references applications(id) on delete cascade,
  role           text        not null,   -- 'user' or 'ai'
  content        text        not null,
  created_at     timestamptz default now()
);
```

### job_documents (공고 벡터)
```sql
create extension if not exists vector;

create table job_documents (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        references applications(id) on delete cascade,
  content        text        not null,
  embedding      vector(384),
  created_at     timestamptz default now()
);
```

### 보안 설정
```sql
-- RLS 비활성화 (개인용이므로 인증 없이 사용)
alter table applications disable row level security;
```

---

## 4. 폴더 구조

```
job-tracker/
├── CLAUDE.md                  # Claude Code 가이드
├── README.md                  # 프로젝트 소개
├── .env                       # 환경변수 (git 제외)
├── .env.example               # 환경변수 템플릿
├── vite.config.ts             # base: '/job-tracker/' 설정
├── docs/
│   ├── PRD.md                 # 기획 문서
│   ├── SETUP.md               # 셋업 가이드
│   ├── DASHBOARD.md           # 화면 구조 설명
│   └── PROJECT_SUMMARY.md     # 이 파일
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions 자동 배포
├── src/
│   ├── types/index.ts         # 공통 타입 + 상수
│   ├── lib/supabase.ts        # Supabase 클라이언트
│   ├── components/
│   │   ├── AddModal.tsx       # 지원 추가 모달
│   │   ├── EditModal.tsx      # 지원 수정 모달
│   │   ├── ChatModal.tsx      # AI 채팅 모달
│   │   └── StatusBadge.tsx    # 상태 뱃지
│   └── App.tsx                # 메인 페이지
└── backend/                   # FastAPI RAG 서버
    ├── .env                   # 백엔드 환경변수 (git 제외)
    ├── main.py                # FastAPI 앱 + 라우터
    ├── crawler.py             # 공고 URL 크롤링
    ├── embedder.py            # 텍스트 벡터 변환
    ├── llm.py                 # Groq LLM 호출
    ├── db.py                  # Supabase 벡터 DB 연동
    └── venv/                  # Python 가상환경
```

---

## 5. 환경변수 정리

### 프론트엔드 (`~/job-tracker/.env`)
```env
VITE_SUPABASE_URL=https://eksyliqqmvfspujizyru.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # Supabase anon public key
```

### 백엔드 (`~/job-tracker/backend/.env`)
```env
SUPABASE_URL=https://eksyliqqmvfspujizyru.supabase.co
SUPABASE_KEY=eyJ...             # Supabase service_role key (anon과 다름!)
GROQ_API_KEY=gsk_...            # Groq API key
```

### GitHub Secrets (배포용)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- GitHub 레포 → Settings → Secrets → Actions에서 등록

---

## 6. 로컬 실행 방법

**터미널을 반드시 2개 열어야 합니다!**

### 터미널 1 — 백엔드 서버
```bash
cd ~/job-tracker/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
→ `http://127.0.0.1:8000` 에서 실행
→ **이 터미널은 끄면 안 됨! AI 채팅이 안 됨**

### 터미널 2 — 프론트엔드
```bash
cd ~/job-tracker
npm run dev
```
→ `http://localhost:5173/job-tracker/` 에서 실행

---

## 7. 배포 URL

- **프론트엔드**: https://jjjuni-0818.github.io/job-tracker/
- **백엔드**: 로컬에서만 실행 (배포 안 함)

> ⚠️ 배포 URL에서는 AI 채팅 기능이 안 됩니다.
> 백엔드가 로컬에서만 실행되기 때문.
> 나중에 Railway나 Render에 백엔드 배포하면 해결됩니다.

---

## 8. 겪었던 문제와 해결 방법

### 문제 1 — 저장이 안 됨 (Supabase RLS)
- **원인**: Supabase 기본 보안 정책(RLS)이 INSERT를 막음
- **해결**:
```sql
alter table applications disable row level security;
```

### 문제 2 — .env에 placeholder 텍스트가 그대로 있었음
- **원인**: `.env.example` 복사 후 실제 값으로 교체 안 함
- **증상**: 브라우저 콘솔에 `your-project-id.supabase.co` 에러
- **해결**: `.env` 열어서 실제 Supabase URL과 anon key로 교체 후 `npm run dev` 재시작

### 문제 3 — 포트 8000 이미 사용 중 (Address already in use)
- **원인**: 백그라운드로 실행한 서버가 아직 살아있는 상태에서 또 실행
- **해결**:
```bash
lsof -ti:8000 | xargs kill -9
```

### 문제 4 — Groq 모델 오류 (model_decommissioned)
- **원인**: `llama3-8b-8192` 모델이 더 이상 지원 안 됨
- **해결**: `llama-3.1-8b-instant` 으로 변경

### 문제 5 — 한글 입력 후 Enter 시 마지막 글자가 남음
- **원인**: 한글 자모 조합 중 Enter 이벤트가 중복 발생
- **해결**:
```tsx
onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend(); }}
```

### 문제 6 — GitHub Pages 탭에서 플랫폼 탭이 안 보임
- **원인**: 배포 캐시
- **해결**: Ctrl + Shift + R (강제 새로고침)

---

## 9. RAG 동작 흐름

```
1. 공고 URL 입력 (✏️ 수정에서)
        ↓
2. 💬 버튼 클릭 → ChatModal 열림
        ↓
3. "공고 분석 시작" 버튼 클릭
        ↓
4. 백엔드 POST /ingest 호출
   - BeautifulSoup으로 공고 페이지 크롤링
   - HuggingFace로 텍스트 → 벡터(384차원) 변환
   - Supabase job_documents 테이블에 저장
        ↓
5. 질문 입력 후 전송
        ↓
6. 백엔드 POST /chat 호출
   - 저장된 공고 내용 꺼내기
   - 공고 내용 + 질문 → Groq LLM (llama3)
   - 답변 반환
        ↓
7. 채팅 기록 Supabase chat_messages에 저장
   → 다음에 열면 이전 대화 자동 로드
```

---

## 10. 앞으로 할 수 있는 것들

- [ ] 백엔드 배포 (Railway/Render) → 배포 URL에서도 AI 채팅 가능
- [ ] 면접 날짜 관리
- [ ] 통계 차트 (월별 지원 수, 합격률)
- [ ] 모바일 반응형
- [ ] 검색 기능
