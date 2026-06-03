# 취업 지원 현황 트래커

> 여러 채용 플랫폼에 지원한 내역을 한 곳에서 관리하는 개인용 대시보드

**배포 URL**: https://jjjuni-0818.github.io/job-tracker/

---

## 주요 기능

- 지원 내역 추가 (회사명, 포지션, 플랫폼, 지원일, 상태, 메모)
- 상태 관리: 서류중 / 서류합격 / 면접 / 최종합격 / 탈락
- 상태별 필터링 및 건수 확인
- 테이블에서 상태 즉시 변경

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **DB**: Supabase (PostgreSQL)
- **배포**: GitHub Pages + GitHub Actions

## 로컬 실행

```bash
npm install
cp .env.example .env   # Supabase 키 입력 후
npm run dev
```

자세한 셋업 방법: [docs/SETUP.md](docs/SETUP.md)

## 문서

- [PRD — 기획 문서](docs/PRD.md)
- [대시보드 구조 설명](docs/DASHBOARD.md)
- [셋업 가이드](docs/SETUP.md)
