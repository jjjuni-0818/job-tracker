# ============================================================
# embedder.py — 텍스트 → 벡터 변환 (HuggingFace, 완전 무료)
# ============================================================
# sentence-transformers 라이브러리로 로컬에서 임베딩 생성
# 모델: paraphrase-multilingual-MiniLM-L12-v2 (한국어 지원)

from sentence_transformers import SentenceTransformer

# Lazy loading: 서버 시작 시 바로 다운로드하지 않고
# 처음 get_embedding() 호출될 때 로드 (healthcheck 통과 목적)
_model = None

def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _model

def get_embedding(text: str) -> list[float]:
    embedding = _get_model().encode(text, normalize_embeddings=True)
    return embedding.tolist()
