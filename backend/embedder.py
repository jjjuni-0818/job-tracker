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


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """텍스트를 chunk_size 글자 단위로 나눔. overlap으로 앞뒤 문맥 이어지게 함.

    예) chunk_size=500, overlap=50이면
        0~500, 450~950, 900~1400 ... 이렇게 50자씩 겹치면서 잘림
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap  # 다음 청크는 overlap만큼 뒤로
    return chunks


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """여러 텍스트를 한 번에 임베딩 (API 호출 횟수 절약)"""
    response = _get_client().embed(
        texts=texts,
        model="embed-multilingual-light-v3.0",
        input_type="search_document",
    )
    return response.embeddings
