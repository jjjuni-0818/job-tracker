// ============================================================
// types/index.ts — 프로젝트 전체에서 공유하는 타입과 상수 정의
// ============================================================

export type Status = '서류중' | '서류합격' | '면접' | '최종합격' | '탈락';

export const STATUS_LIST: Status[] = ['서류중', '서류합격', '면접', '최종합격', '탈락'];

export const PLATFORM_LIST = ['원티드', '사람인', '그룹바이', '링크드인', '잡코리아', '직접지원', '기타'];

// Claude 디자인 컬러 시스템
export const STATUS_COLOR: Record<Status, { bg: string; text: string; soft: string }> = {
  서류중:   { bg: '#7c6af7', text: '#fff', soft: '#eeecff' },
  서류합격: { bg: '#c96442', text: '#fff', soft: '#f5ede8' },
  면접:     { bg: '#b07d2a', text: '#fff', soft: '#fdf5e6' },
  최종합격: { bg: '#3d8f6f', text: '#fff', soft: '#e8f4ef' },
  탈락:     { bg: '#b0a89e', text: '#fff', soft: '#f0ece8' },
};

export interface Application {
  id: string;
  company_name: string;
  position: string;
  platform: string;
  applied_at: string;
  status: Status;
  job_url: string;
  interview_at: string | null;
  notes: string;
  created_at: string;
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at'>;
