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
    client = get_client()

    applicant_info = f"""
[지원자 정보]
- 이름: 정주원 (신입 개발자, AI헬스케어 부트캠프 6개월 수료)
- 보유 기술: Python, FastAPI, React, TypeScript, Supabase(PostgreSQL), Pandas, GitHub Actions, 배포(Vercel/GitHub Pages)
- 없는 기술: Node.js, Java, Spring
- 지원 회사: {company_name}
- 지원 포지션: {position}
- 현재 전형: {status}
""" if company_name else ""

    prompt = f"""당신은 신입 개발자 정주원의 취업 면접을 도와주는 코치입니다.
아래 [채용 공고]와 [지원자 정보]를 바탕으로 질문에 답변하세요.

━━━ 핵심 규칙 ━━━
⚠️ [지원자 보유 기술]과 [공고 요구 기술]을 절대 혼동하지 마세요.
   지원자가 보유한 기술: Python, FastAPI, React, TypeScript, Supabase, Pandas, Git, GitHub Actions
   지원자가 없는 기술: Node.js, Express, Java, Spring (공고에 있어도 지원자 기술이 아님)

1. 기술 어필 시 → 반드시 [지원자 보유 기술] 목록에 있는 것만 언급
2. 공고에 없는 내용 → "공고에 해당 내용이 없습니다"
3. 공고에 있지만 지원자에게 없는 기술(Node.js 등) → "부족한 부분"으로만 언급
4. 예상 면접 질문 → 공고 기반, 신입 눈높이, 질문 형태 5개
5. 자기소개/지원이유 → 정주원의 실제 기술과 공고 업무 연결, 2~3문장, 자연스럽게
6. "[지원자 이름]" 같은 플레이스홀더 절대 사용 금지. 이름은 "정주원"
7. 불필요한 반복 금지. 간결하게
━━━━━━━━━━
{applicant_info}
[채용 공고]
{context}

[질문]
{question}

답변:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1500,
    )

    return response.choices[0].message.content
