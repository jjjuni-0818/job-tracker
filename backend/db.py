# ============================================================
# db.py — Supabase 벡터 DB 연동
# ============================================================

import os
from supabase import create_client

_client = None

def get_client():
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),  # service_role key 사용 (벡터 검색 권한 필요)
        )
    return _client

def save_document(application_id: str, content: str, embedding: list[float]):
    """공고 텍스트와 임베딩을 job_documents 테이블에 저장"""
    client = get_client()
    # 기존 데이터가 있으면 덮어쓰기
    client.table("job_documents").delete().eq("application_id", application_id).execute()
    client.table("job_documents").insert({
        "application_id": application_id,
        "content": content,
        "embedding": embedding,
    }).execute()

def search_similar(application_id: str, query_embedding: list[float]) -> str:
    """해당 공고의 저장된 내용 반환 (단일 공고 기반 RAG)"""
    client = get_client()
    res = client.table("job_documents") \
        .select("content") \
        .eq("application_id", application_id) \
        .limit(1) \
        .execute()

    if res.data:
        return res.data[0]["content"]
    return ""
