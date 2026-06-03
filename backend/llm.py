# ============================================================
# llm.py — Groq API로 LLM 답변 생성
# ============================================================

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

답변 규칙:
1. 반드시 공고 내용을 바탕으로 답변하세요. 공고에 없는 내용은 지어내지 마세요.
2. "예상 면접 질문"을 물어보면 반드시 "?" 로 끝나는 질문 형식으로 5~7개 만들어주세요.
   예) "Snowflake를 활용한 데이터 파이프라인 경험이 있으신가요?"
   절대 자격요건 문장을 그대로 복붙하지 마세요.
3. 답변은 간결하고 명확하게, 한국어로 작성하세요.
4. 번호 목록을 쓸 때는 각 항목을 줄바꿈으로 구분하세요.

[채용 공고 내용]
{context}

[질문]
{question}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=1500,  # 더 긴 답변 허용
    )

    return response.choices[0].message.content
