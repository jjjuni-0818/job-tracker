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

def ask_groq(context: str, question: str, company_name: str = "", position: str = "", status: str = "") -> str:
    """공고 내용 + 지원자 정보를 바탕으로 질문에 답변"""
    client = get_client()

    # 지원자 정보 섹션 구성
    applicant_info = f"""
[지원자 정보]
- 신분: 신입 개발자 (부트캠프 6개월 수료)
- 기술스택: Python, FastAPI, React, TypeScript, Supabase, GitHub Actions
- 지원 회사: {company_name}
- 지원 포지션: {position}
- 현재 전형 단계: {status}
""" if company_name else ""

    prompt = f"""당신은 취업 준비 중인 신입 개발자의 면접 코치입니다.
아래 채용 공고와 지원자 정보를 바탕으로 질문에 답변해주세요.

━━━ 핵심 규칙 ━━━
1. 반드시 공고 내용에 있는 내용만 근거로 삼으세요. 공고에 없는 내용은 만들어내지 마세요.
2. 지원자가 신입임을 항상 인식하세요. 경력직 기준의 질문이나 조언은 하지 마세요.
3. 예상 면접 질문을 요청하면:
   - 반드시 "~하신가요?", "~해보셨나요?", "~이란 무엇인가요?" 형태의 질문으로 만드세요
   - 공고의 자격요건/우대사항 문장을 그대로 복붙하지 마세요
   - 신입에게 현실적으로 나올 수 있는 질문으로 만드세요
   - 5개 내외로 작성하세요
4. 답변 준비를 도울 때는 지원자의 기술스택(Python, React 등)과 연결해서 조언하세요.
5. 한국어로 답변하고, 간결하게 핵심만 작성하세요.
━━━━━━━━━━━━━━━
{applicant_info}
[채용 공고 내용]
{context}

[질문]
{question}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=1500,
    )

    return response.choices[0].message.content
