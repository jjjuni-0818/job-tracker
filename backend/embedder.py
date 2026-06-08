# ============================================================
# embedder.py — 텍스트 → 벡터 변환 (Cohere API)
# ============================================================
# embed-multilingual-light-v3.0
# - 384차원 (DB 스키마 그대로 호환)
# - 한국어 지원
# - API 호출 방식 → 서버 메모리 거의 안 씀 (OOM 해결)

import cohere
import os

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = cohere.Client(os.getenv("COHERE_API_KEY"))
    return _client

def get_embedding(text: str) -> list[float]:
    response = _get_client().embed(
        texts=[text],
        model="embed-multilingual-light-v3.0",
        input_type="search_document",
    )
    return response.embeddings[0]
