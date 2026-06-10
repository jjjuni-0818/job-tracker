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

def save_document(application_id: str, contents: list[str], embeddings: list[list[float]]):
    """청크별 텍스트와 임베딩을 job_documents 테이블에 저장"""
    client = get_client()
    # 기존 데이터 삭제 (공고 재분석 시 덮어쓰기)
    client.table("job_documents").delete().eq("application_id", application_id).execute()
    # 청크 전체 한 번에 삽입
    rows = [
        {"application_id": application_id, "content": content, "embedding": embedding}
        for content, embedding in zip(contents, embeddings)
    ]
    client.table("job_documents").insert(rows).execute()

def search_similar(application_id: str, query_embedding: list[float], top_k: int = 5) -> str:
    """질문과 가장 유사한 공고 청크를 코사인 유사도로 검색"""
    client = get_client()
    res = client.rpc("match_job_documents", {
        "query_embedding": query_embedding,
        "match_application_id": application_id,
        "match_count": top_k,
    }).execute()

    if res.data:
        # 유사도 높은 순으로 정렬된 청크들을 합쳐서 반환
        return "\n\n".join([r["content"] for r in res.data])
    return ""
