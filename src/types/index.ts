// ============================================================
// types/index.ts — 프로젝트 전체에서 공유하는 타입과 상수 정의
// ============================================================

// 지원 상태 (DB의 status 컬럼에 들어가는 값들)
export type Status = '서류중' | '서류합격' | '면접' | '최종합격' | '탈락';

// 상태 선택 드롭다운에 표시할 순서
export const STATUS_LIST: Status[] = ['서류중', '서류합격', '면접', '최종합격', '탈락'];

// 지원 플랫폼 선택 목록
export const PLATFORM_LIST = ['원티드', '사람인', '그룹바이', '링크드인', '잡코리아', '직접지원', '기타'];

// 상태별 색상 (뱃지 배경색으로 사용)
export const STATUS_COLOR: Record<Status, string> = {
  서류중:   '#6366f1', // 인디고 — 대기 중
  서류합격: '#3b82f6', // 파랑   — 다음 단계 진행 중
  면접:     '#f59e0b', // 황금   — 면접 단계
  최종합격: '#22c55e', // 초록   — 합격!
  탈락:     '#9ca3af', // 회색   — 종료
};

// Supabase applications 테이블의 행 타입
// DB에서 받아오는 전체 데이터 (id, created_at 포함)
export interface Application {
  id: string;
  company_name: string;
  position: string;
  platform: string;
  applied_at: string;   // 'YYYY-MM-DD' 형식의 날짜 문자열
  status: Status;
  notes: string;
  created_at: string;
}

// 새 지원 추가 시 Supabase에 INSERT할 데이터 타입
// id와 created_at은 DB에서 자동 생성되므로 제외
export type ApplicationInsert = Omit<Application, 'id' | 'created_at'>;
