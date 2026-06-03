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

    applicant_info = f"""
[지원자 정보]
- 신분: 신입 개발자 (AI헬스케어 부트캠프 6개월 수료)
- 보유 기술: Python, FastAPI, React, TypeScript, Supabase(PostgreSQL), Pandas, GitHub Actions, Vercel/GitHub Pages 배포
- Node.js, Spring, Java 경험 없음
- 지원 회사: {company_name}
- 지원 포지션: {position}
- 현재 전형 단계: {status}
""" if company_name else ""

    prompt = f"""당신은 신입 개발자의 취업 면접을 도와주는 코치입니다.
반드시 아래 [채용 공고 내용]과 [지원자 정보]만을 근거로 답변하세요.

━━━ 절대 규칙 ━━━
1. [채용 공고 내용]에 없는 기술, 회사 정보, 업무는 절대 언급하지 마세요.
   공고에 없는 내용을 추측하거나 만들어내면 안 됩니다.
2. 지원자는 신입입니다. 경력 기준의 답변을 하지 마세요.
3. 지원자의 실제 보유 기술(Python, FastAPI, React, TypeScript, Supabase)만 언급하세요.
   공고에 없거나 지원자가 보유하지 않은 기술(Node.js 등)은 언급하지 마세요.
4. 예상 면접 질문 요청 시:
   - 반드시 공고에 실제로 나온 내용 기반으로만 만드세요
   - "~하신가요?", "~해보셨나요?", "~에 대해 설명해주세요" 형태의 질문으로 작성
   - 신입 개발자에게 나올 법한 현실적인 질문 5개
5. 공고에 없는 내용을 질문받으면 "공고에 해당 내용이 없습니다"라고 답하세요.
━━━━━━━━━━━━━━━
{applicant_info}
[채용 공고 내용]
{context}

[질문]
{question}

답변:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # 낮출수록 할루시네이션 감소
        max_tokens=1500,
    )

    return response.choices[0].message.content
