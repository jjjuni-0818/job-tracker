# ============================================================
# llm.py — Groq API로 LLM 답변 생성
# ============================================================
# Groq는 llama3를 무료로 매우 빠르게 제공함

import os
from groq import Groq

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

def ask_groq(context: str, question: str) -> str:
    """공고 내용(context)을 바탕으로 질문에 답변"""
    client = get_client()

    prompt = f"""당신은 취업 준비를 도와주는 AI 어시스턴트입니다.
아래 채용 공고 내용을 참고해서 질문에 답변해주세요.
공고 내용에 없는 내용은 지어내지 말고, 모른다고 솔직하게 말해주세요.
답변은 한국어로 해주세요.

[채용 공고 내용]
{context}

[질문]
{question}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",   # 무료, 빠름
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,           # 낮을수록 일관된 답변
        max_tokens=1024,
    )

    return response.choices[0].message.content
