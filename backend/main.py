# ============================================================
# main.py — FastAPI 백엔드 (RAG 기반 공고 분석 + 면접 준비)
# ============================================================
# 엔드포인트:
#   POST /ingest      - 공고 URL 크롤링 → 벡터 임베딩 → Supabase 저장
#   POST /chat        - 질문 → 관련 공고 검색 → Groq LLM 답변

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os

from crawler import crawl_url
from embedder import get_embedding, chunk_text, get_embeddings_batch
from llm import ask_groq, ask_groq_stream
from db import save_document, search_similar

load_dotenv()

app = FastAPI(title="Job Tracker RAG API")

# 환경변수로 CORS 허용 URL 관리 (로컬 + 배포 둘 다 허용)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,https://jjjuni-0818.github.io").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 요청/응답 스키마 ──────────────────────────────────────────
class IngestRequest(BaseModel):
    application_id: str  # applications 테이블의 id
    url: str             # 공고 URL
    company_name: str    # 회사명 (크롤링 결과 검증용)
    position: str        # 포지션 (크롤링 결과 검증용)

class ChatRequest(BaseModel):
    application_id: str  # 어떤 공고에 대한 질문인지
    question: str        # 사용자 질문
    company_name: str = ""    # 회사명 (LLM 컨텍스트용)
    position: str = ""        # 지원 포지션 (LLM 컨텍스트용)
    status: str = ""          # 현재 전형 상태 (LLM 컨텍스트용)
    history: list[dict] = []  # 이전 대화 [{role: "user"/"ai", content: str}]

# ── 공고 크롤링 + 저장 ────────────────────────────────────────
@app.post("/ingest")
async def ingest(req: IngestRequest):
    # 1. URL에서 공고 텍스트 추출
    text = crawl_url(req.url)
    if not text:
        raise HTTPException(status_code=400, detail="공고 내용을 가져올 수 없습니다.")

    # 2. 크롤링 결과 검증 — 회사명 또는 포지션이 공고에 있는지 확인
    text_lower = text.lower()
    company_found = req.company_name.lower() in text_lower
    # 포지션은 일부 단어만 있어도 OK (띄어쓰기로 분리해서 체크)
    position_words = [w for w in req.position.lower().split() if len(w) > 1]
    position_found = any(w in text_lower for w in position_words)

    warning = None
    if not company_found and not position_found:
        warning = f"'{req.company_name}' 또는 포지션 관련 내용이 공고에서 발견되지 않았습니다. URL을 확인해주세요."
    elif not company_found:
        warning = f"'{req.company_name}'이 공고에서 발견되지 않았습니다. 다른 회사 공고일 수 있습니다."

    # 3. 텍스트를 청크로 분할
    chunks = chunk_text(text, chunk_size=500, overlap=50)

    # 4. 청크 전체를 한 번에 임베딩 (API 호출 1회로 절약)
    embeddings = get_embeddings_batch(chunks)

    # 5. Supabase에 청크별로 저장
    save_document(req.application_id, chunks, embeddings)

    return {
        "status": "ok",
        "text_length": len(text),
        "chunk_count": len(chunks),  # 몇 개 청크로 나뉘었는지
        "company_found": company_found,
        "position_found": position_found,
        "warning": warning,
    }

# ── RAG 채팅 ─────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    # 1. 질문을 벡터로 변환
    q_embedding = get_embedding(req.question)

    # 2. 저장된 공고 중 가장 유사한 내용 검색
    context = search_similar(req.application_id, q_embedding)
    if not context:
        raise HTTPException(status_code=404, detail="공고 내용이 없습니다. 먼저 공고 URL을 등록해주세요.")

    # 3. Groq LLM에 컨텍스트 + 질문 + 히스토리 전달 → 답변 생성
    answer = ask_groq(context, req.question, req.company_name, req.position, req.status, req.history)

    return {"answer": answer}

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    # 1. 질문을 벡터로 변환
    q_embedding = get_embedding(req.question)

    # 2. 유사한 공고 청크 검색
    context = search_similar(req.application_id, q_embedding)
    if not context:
        raise HTTPException(status_code=404, detail="공고 내용이 없습니다. 먼저 공고 URL을 등록해주세요.")

    # 3. 스트리밍으로 LLM 답변 전송 (히스토리 포함, X-Accel-Buffering: no → 프록시 버퍼링 비활성화)
    return StreamingResponse(
        ask_groq_stream(context, req.question, req.company_name, req.position, req.status, req.history),
        media_type="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no"},
    )

@app.get("/health")
def health():
    return {"status": "ok"}

# ── 모델 워밍업 (ChatModal 열릴 때 미리 호출) ─────────────────────
# 첫 /ingest 요청 전에 모델을 미리 로드해두기 위한 엔드포인트
def _warmup_model():
    get_embedding("warmup")

@app.post("/warmup")
async def warmup(background_tasks: BackgroundTasks):
    # 백그라운드에서 모델 로드 시작 → 즉시 200 반환
    background_tasks.add_task(_warmup_model)
    return {"status": "warming up"}
