# CLAUDE.md — 취업 지원 현황 트래커

Claude Code가 이 프로젝트를 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

취업 지원 현황을 한눈에 관리하는 개인용 대시보드.
여러 채용 플랫폼(원티드, 사람인, 그룹바이 등)에서 지원한 내역을 한 곳에서 추적한다.

## 기술 스택

| 역할 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite |
| Database | Supabase (PostgreSQL) |
| 배포 | GitHub Pages (gh-pages 브랜치) |
| CI/CD | GitHub Actions |

## 폴더 구조

```
src/
├── components/     # 재사용 UI 컴포넌트
│   ├── AddModal.tsx    # 지원 추가 모달
│   └── StatusBadge.tsx # 상태 표시 뱃지
├── lib/
│   └── supabase.ts     # Supabase 클라이언트 초기화
├── types/
│   └── index.ts        # 공통 타입 정의
├── App.tsx             # 메인 페이지 (목록 + 필터)
└── main.tsx            # 앱 진입점
```

## 환경 변수

`.env` 파일 필요 (`.env.example` 참고):
- `VITE_SUPABASE_URL` — Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon public key

## 자주 쓰는 명령어

```bash
npm run dev      # 로컬 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 코딩 컨벤션

- 컴포넌트: PascalCase (`AddModal.tsx`)
- 함수/변수: camelCase (`handleAdd`)
- 상수: UPPER_SNAKE_CASE (`STATUS_LIST`)
- 스타일: inline style 객체 (별도 CSS 파일 없음, 단순함 유지)
- Supabase 호출은 항상 async/await 사용

## DB 스키마

```sql
applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  position      text NOT NULL,
  platform      text NOT NULL DEFAULT '원티드',
  applied_at    date NOT NULL,
  status        text NOT NULL DEFAULT '서류중',
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now()
)
```

## 주의사항

- `.env` 파일은 절대 커밋하지 않는다 (`.gitignore`에 포함됨)
- GitHub Actions 배포 시 환경변수는 GitHub Secrets에서 관리
- `vite.config.ts`의 `base: '/job-tracker/'` 는 GitHub Pages 경로와 일치해야 함
