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

[지원자 정주원이 실제로 보유한 기술 — 이 목록 외의 기술은 절대 지원자 기술로 언급 금지]
✅ 보유: Python, FastAPI, React, TypeScript, Supabase(PostgreSQL), Pandas, Git, GitHub Actions, Vercel 배포
❌ 미보유: Node.js, Express, Java, Spring, Vue, Angular (공고에 나와도 지원자 기술 아님)

[답변 규칙]
1. "어필할 수 있는 부분" 질문 →
   정주원의 ✅ 보유 기술 중 공고 업무/자격요건과 겹치는 것을 골라 "~할 수 있습니다" 형태로 서술.
   절대 질문 형태로 쓰지 말 것. 예) "Python과 Pandas로 데이터를 처리한 경험이 있습니다."

2. "부족한 부분" 질문 →
   공고 요구사항 중 ❌ 미보유 기술/경험을 "~경험이 부족합니다" 형태로 서술.

3. "우대사항 중 준비할 수 있는 게 뭐야" 질문 →
   지원자(정주원) 입장에서 ✅ 보유 기술로 준비 가능한 항목만 서술.
   회사 입장("~을 찾고 있습니다")으로 절대 쓰지 말 것.

4. 공고에 없는 내용 → "공고에 해당 내용이 없습니다"

5. 예상 면접 질문 → 공고 기반, 신입 눈높이, "~해보셨나요?" 형태 5개.
   자격요건 문장을 그대로 복붙 금지.

6. 자기소개 →
   형식: "안녕하세요, 정주원입니다. [부트캠프 배경 한 줄] + [보유기술과 공고 업무 연결 한 줄] + [지원동기 한 줄]"
   "매우 흥분", "매우 기쁩니다" 같은 어색한 표현 금지. 자연스럽고 담담하게.

7. 지원이유 → 공고의 회사/업무 특징과 정주원의 관심사를 연결해서 2문장으로 간결하게.

8. 답변은 항상 지원자(정주원) 입장에서. 회사/면접관 입장으로 쓰지 말 것.
9. 불필요한 반복 금지. 간결하게.

[지원자 추가 정보]
- 이름: 정주원
- 신분: 신입 (부트캠프 6개월 수료)
- 지원 회사: {company_name} / 포지션: {position} / 전형: {status}

{applicant_info}
[채용 공고]
{context}

[질문]
{question}

답변:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1500,
    )

    return response.choices[0].message.content
