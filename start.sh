#!/bin/bash
# ============================================================
# start.sh — 백엔드 + 프론트엔드 한번에 실행
# ============================================================
# 사용법: ./start.sh
# 종료: Ctrl+C

echo "🚀 백엔드 서버 시작..."
cd "$(dirname "$0")/backend"
source venv/bin/activate
uvicorn main:app --port 8000 &
BACKEND_PID=$!

sleep 3
echo "✅ 백엔드 실행 중 (PID: $BACKEND_PID)"

echo "🚀 프론트엔드 시작..."
cd "$(dirname "$0")"
npm run dev &
FRONTEND_PID=$!

echo "✅ 프론트엔드 실행 중"
echo ""
echo "📌 접속: http://localhost:5173/job-tracker/"
echo "📌 종료: Ctrl+C"

# Ctrl+C 시 둘 다 종료
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '서버 종료'" EXIT
wait
