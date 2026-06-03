# ============================================================
# embedder.py — 텍스트 → 벡터 변환 (HuggingFace, 완전 무료)
# ============================================================
# sentence-transformers 라이브러리로 로컬에서 임베딩 생성
# 모델: paraphrase-multilingual-MiniLM-L12-v2 (한국어 지원)

from sentence_transformers import SentenceTransformer

# 모델 최초 실행 시 자동 다운로드 (~120MB), 이후 캐시 사용
_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

def get_embedding(text: str) -> list[float]:
    embedding = _model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
