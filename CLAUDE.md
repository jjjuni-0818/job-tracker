# CLAUDE.md — 취업 지원 현황 트래커

Claude Code가 이 프로젝트를 작업할 때 참고하는 가이드입니다.

---

## 프로젝트 개요

취업 지원 현황을 한눈에 관리하고 AI로 면접을 준비하는 개인용 대시보드.
원티드, 사람인, 그룹바이 등 여러 채용 플랫폼의 지원 내역을 한 곳에서 관리한다.

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite |
| DB | Supabase (PostgreSQL + pgvector) |
| 백엔드 | FastAPI (Python) |
| 임베딩 | HuggingFace sentence-transformers (로컬, 무료) |
| LLM | Groq API - llama-3.1-8b-instant (무료) |
| 크롤링 | BeautifulSoup |
| 배포 | GitHub Pages + GitHub Actions |

---

## 폴더 구조

```
job-tracker/
├── src/
│   ├── components/
│   │   ├── AddModal.tsx      # 지원 추가 모달
│   │   ├── EditModal.tsx     # 지원 수정 모달
│   │   ├── ChatModal.tsx     # AI 면접 준비 채팅 (RAG)
│   │   ├── Login.tsx         # 비밀번호 보호 화면
│   │   ├── StatusBadge.tsx   # 상태 뱃지
│   │   └── Icons.tsx         # SVG 아이콘 모음
│   ├── lib/
│   │   └── supabase.ts       # Supabase 클라이언트
│   ├── types/
│   │   └── index.ts          # 공통 타입 + 상수 (STATUS_COLOR 등)
│   ├── App.tsx               # 메인 페이지
│   ├── main.tsx              # 앱 진입점 (비밀번호 보호 포함)
│   └── App.css               # Claude 디자인 시스템 CSS 변수
├── backend/
│   ├── main.py               # FastAPI 엔드포인트 (/ingest, /chat, /health)
│   ├── crawler.py            # 공고 URL 크롤링 (BeautifulSoup)
│   ├── embedder.py           # 텍스트 → 벡터 변환 (HuggingFace)
│   ├── llm.py                # Groq LLM 호출 + 프롬프트
│   ├── db.py                 # Supabase 벡터 DB 연동
│   ├── requirements.txt      # Python 패키지
│   ├── railway.toml          # Railway 배포 설정
│   └── .env                  # 백엔드 환경변수 (git 제외)
├── docs/
│   ├── PRD.md                # 기획 문서
│   ├── SETUP.md              # 셋업 가이드
│   ├── DASHBOARD.md          # 화면 구조
│   ├── PROJECT_SUMMARY.md    # 1차 개발 정리
│   ├── PROJECT_SUMMARY2.md   # 2차 개발 정리 (UI/RAG/프롬프트)
│   ├── velog_post.md         # 벨로그 1편 (트래커 만들기)
│   └── velog_rag.md          # 벨로그 2편 (RAG 구현)
├── start.sh                  # 백엔드 + 프론트 한번에 실행
├── .env                      # 프론트 환경변수 (git 제외)
├── .env.example              # 환경변수 템플릿
├── vite.config.ts            # base: '/job-tracker/' 설정
└── .github/workflows/
    └── deploy.yml            # GitHub Actions 자동 배포

```

---

## 환경 변수

### 프론트엔드 (`.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # anon public key
```

### 백엔드 (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...             # service_role key (anon과 다름!)
GROQ_API_KEY=gsk_...
```

---

## DB 스키마

```sql
-- 지원 목록
applications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  position     text NOT NULL,
  platform     text NOT NULL DEFAULT '원티드',
  applied_at   date NOT NULL,
  status       text NOT NULL DEFAULT '서류중',
  job_url      text DEFAULT '',
  interview_at date,              -- nullable, 빈 문자열 말고 null로 저장
  notes        text DEFAULT '',
  created_at   timestamptz DEFAULT now()
)

-- 채팅 기록
chat_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  role           text NOT NULL,   -- 'user' or 'ai'
  content        text NOT NULL,
  created_at     timestamptz DEFAULT now()
)

-- 공고 벡터 (RAG)
job_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  content        text NOT NULL,   -- 크롤링된 공고 텍스트
  embedding      vector(384),     -- HuggingFace 384차원 벡터
  created_at     timestamptz DEFAULT now()
)
```

---

## API 엔드포인트

### FastAPI (backend/main.py)

| 메서드 | 경로 | 역할 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/ingest` | 공고 크롤링 + 검증 + 벡터 저장 |
| POST | `/chat` | RAG 채팅 답변 생성 |

### /ingest 요청 바디
```json
{
  "application_id": "uuid",
  "url": "https://...",
  "company_name": "카카오",
  "position": "백엔드 개발자"
}
```

### /chat 요청 바디
```json
{
  "application_id": "uuid",
  "question": "예상 면접 질문 알려줘",
  "company_name": "카카오",
  "position": "백엔드 개발자",
  "status": "서류중"
}
```

---

## 자주 쓰는 명령어

```bash
# 한번에 실행 (권장)
./start.sh

# 프론트만
npm run dev

# 백엔드만
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# 빌드
npm run build

# 포트 충돌 시
lsof -ti:8000 | xargs kill -9
```

---

## 코딩 컨벤션

- 컴포넌트: PascalCase (`AddModal.tsx`)
- 함수/변수: camelCase (`handleAdd`)
- 상수: UPPER_SNAKE_CASE (`STATUS_LIST`)
- 스타일: CSS 변수(`var(--accent)`) + inline style 객체
- Supabase 호출: 항상 async/await
- date 타입 컬럼: 빈 문자열 대신 `null` 전송 (`interview_at: value || null`)

---

## 주의사항

- `.env`, `backend/.env` 는 절대 커밋하지 않는다
- GitHub Actions 배포 시 환경변수는 GitHub Secrets에서 관리
- `vite.config.ts`의 `base: '/job-tracker/'` 는 GitHub Pages 경로와 일치해야 함
- 비밀번호는 `src/components/Login.tsx`의 `PASSWORD` 상수에서 변경
- interview_at 컬럼은 date 타입 → 빈 문자열 보내면 400 에러 (null로 보내야 함)
- RLS는 모든 테이블에서 비활성화 상태 (개인용 앱)
