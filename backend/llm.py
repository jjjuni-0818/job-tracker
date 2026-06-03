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

━━━ 규칙 ━━━
1. 기술스택은 공고의 자격요건/우대사항/주요업무에서 찾으세요.
   예) 자격요건에 "React + TypeScript 경험" 이 있으면 → React, TypeScript가 기술스택임.
2. 공고에 없는 내용은 절대 만들지 마세요. 없으면 "공고에 해당 내용이 없습니다"라고 하세요.
3. 지원자 이름은 정주원입니다. [지원자 이름] 같은 플레이스홀더를 쓰지 마세요.
4. 예상 면접 질문 요청 시:
   - 공고 내용 기반으로만, 신입에게 나올 법한 질문 5개
   - "~하신가요?", "~해보셨나요?", "경험을 말씀해주세요" 형태
   - 자격요건 문장을 그대로 복붙하지 마세요
5. 자기소개/지원이유 요청 시:
   - 정주원의 실제 기술스택과 공고 업무를 연결해서 2~3문장으로 간결하게
   - 형식적인 문장 금지. 자연스럽게 작성
6. 지원자에게 없는 기술(Node.js 등)은 "부족한 부분"으로만 언급하고 어필 포인트로 쓰지 마세요.
7. 답변은 간결하게. 불필요한 반복 금지.
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
