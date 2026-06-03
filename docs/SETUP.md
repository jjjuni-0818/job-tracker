# 로컬 개발 환경 셋업 가이드

## 1. 사전 준비

- Node.js 18 이상
- npm
- Supabase 계정 및 프로젝트

---

## 2. 프로젝트 클론 & 의존성 설치

```bash
git clone https://github.com/jjjuni-0818/job-tracker.git
cd job-tracker
npm install
```

---

## 3. 환경 변수 설정

`.env.example`을 복사해서 `.env` 파일을 만든다.

```bash
cp .env.example .env
```

`.env` 파일을 열어서 실제 값으로 채운다:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase 값 찾는 방법
1. [https://supabase.com](https://supabase.com) 로그인
2. 프로젝트 선택
3. 좌측 사이드바 → **Project Settings** → **API**
4. `Project URL` → `VITE_SUPABASE_URL`에 복사
5. `anon public` 키 → `VITE_SUPABASE_ANON_KEY`에 복사

---

## 4. Supabase 테이블 생성

Supabase 대시보드 → **SQL Editor** → 아래 SQL 실행:

```sql
create table applications (
  id           uuid        primary key default gen_random_uuid(),
  company_name text        not null,
  position     text        not null,
  platform     text        not null default '원티드',
  applied_at   date        not null,
  status       text        not null default '서류중',
  notes        text        default '',
  created_at   timestamptz default now()
);
```

---

## 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 6. GitHub Pages 배포 설정

### GitHub Secrets 등록
1. GitHub 레포 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 아래 두 개 등록:
   - Name: `VITE_SUPABASE_URL` / Value: Supabase URL
   - Name: `VITE_SUPABASE_ANON_KEY` / Value: Supabase anon key

### GitHub Pages 활성화
1. GitHub 레포 → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / `/ (root)`
4. **Save**

### 배포 트리거
`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 및 배포.

배포 URL: `https://jjjuni-0818.github.io/job-tracker/`
