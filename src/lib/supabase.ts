// ============================================================
// lib/supabase.ts — Supabase 클라이언트 초기화
// ============================================================
// 앱 전체에서 이 파일의 supabase 객체를 import해서 DB 작업을 한다.
// 환경변수는 .env 파일에서 읽어오며, Vite에서는 VITE_ 접두사가 필수.

import { createClient } from '@supabase/supabase-js';

// .env 파일에서 Supabase 접속 정보 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성 (싱글톤 — 앱에서 이 인스턴스 하나만 사용)
export const supabase = createClient(supabaseUrl, supabaseKey);
