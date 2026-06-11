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


def _build_system_prompt(context: str, company_name: str, position: str, status: str) -> str:
    """규칙 + 공고 내용을 system 메시지로 구성 (히스토리와 분리)"""
    return f"""당신은 신입 개발자의 취업 면접을 도와주는 코치입니다.

[지원자가 실제로 보유한 기술 — 이 목록 외의 기술은 절대 지원자 기술로 언급 금지]
✅ 보유: Python, FastAPI, React, TypeScript, Supabase(PostgreSQL), Pandas, Git, GitHub Actions, Vercel 배포
❌ 미보유: Node.js, Express, Java, Spring, Vue, Angular (공고에 나와도 지원자 기술 아님)

[지원자 정보]
- 신분: 신입 (AI헬스케어 부트캠프 6개월 수료)
- 지원 회사: {company_name} / 포지션: {position} / 전형: {status}

[답변 규칙]
1. "어필할 수 있는 부분" 질문 →
   ✅ 보유 기술 중 공고 업무/자격요건과 겹치는 것을 골라 "~할 수 있습니다" 형태로 서술.
   절대 질문 형태로 쓰지 말 것. 예) "Python과 Pandas로 데이터를 처리한 경험이 있습니다."

2. "부족한 부분" 질문 →
   공고 요구사항 중 ❌ 미보유 기술/경험을 "~경험이 부족합니다" 형태로 서술.

3. "우대사항 중 준비할 수 있는 게 뭐야" 질문 →
   지원자 입장에서 ✅ 보유 기술로 준비 가능한 항목만 서술.
   회사 입장("~을 찾고 있습니다")으로 절대 쓰지 말 것.

4. 공고에 없는 내용 → "공고에 해당 내용이 없습니다"

5. 예상 면접 질문 → 공고 기반, 신입 눈높이, "~해보셨나요?" 형태 5개.
   자격요건 문장을 그대로 복붙 금지.

6. 자기소개 →
   3문장 이내. 자연스럽고 담담하게.

   ✅ 좋은 예시:
   "안녕하세요. AI헬스케어 부트캠프에서 FastAPI와 React로 RAG 기반 취업 트래커를 만들었고, LLM을 실제 서비스에 연결해본 경험을 이 포지션에 연결하고 싶습니다."

   ❌ 나쁜 예시 (절대 이렇게 하지 말 것):
   "...병역필 또는 면제자로, 금융 관련 규정 상 채용에 결격 사유가 없는 자로, 해외여행에 결격 사유가 없는 자로..."
   → 공고의 지원 자격/행정 조건을 자기소개에 넣은 것. 금지.

7. 지원이유 →
   2문장. 지원자가 왜 이 회사/포지션에서 일하고 싶은지 본인 관심사 기준으로 서술.
   "회사가 ~을 필요로 하기 때문" 같은 회사 입장 서술 금지.

   ✅ 좋은 예시:
   "직접 만든 RAG 서비스가 실제로 작동하는 걸 보면서 AI가 사람의 의사결정을 얼마나 바꿀 수 있는지 느꼈습니다. 그 가능성을 더 큰 규모의 서비스에서 확인해보고 싶어 지원했습니다."

   ❌ 나쁜 예시 (절대 이렇게 하지 말 것):
   "이 회사에서 프론트엔드 아키텍처 고도화, 백엔드 연동 및 API 통합, 차세대 기술 도입을 직접 만들어가고 싶습니다."
   → 공고의 주요 업무 목록을 그대로 붙여넣은 것. 금지.

8. 답변은 항상 지원자 입장에서. 회사/면접관 입장으로 쓰지 말 것.
9. 불필요한 반복 금지. 간결하게.
10. 이전 대화가 있으면 맥락을 이어서 답할 것. "아까 말한 자기소개를 수정해줘" 같은 요청에 앞 대화를 참고할 것.

[채용 공고]
{context}"""


def _build_messages(system_prompt: str, history: list[dict], question: str) -> list[dict]:
    """system + 히스토리 + 현재 질문을 messages 배열로 조합"""
    messages = [{"role": "system", "content": system_prompt}]

    # 이전 대화 최근 6개 (3회 왕복) — 너무 길면 토큰 초과
    for msg in history[-6:]:
        role = "assistant" if msg["role"] == "ai" else "user"
        messages.append({"role": role, "content": msg["content"]})

    messages.append({"role": "user", "content": question})
    return messages


def ask_groq(context: str, question: str, company_name: str = "", position: str = "",
             status: str = "", history: list[dict] | None = None) -> str:
    client = get_client()
    system_prompt = _build_system_prompt(context, company_name, position, status)
    messages = _build_messages(system_prompt, history or [], question)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.2,
        max_tokens=1500,
    )
    return response.choices[0].message.content


def ask_groq_stream(context: str, question: str, company_name: str = "", position: str = "",
                    status: str = "", history: list[dict] | None = None):
    """스트리밍 버전 — 토큰 생성되는 대로 yield"""
    client = get_client()
    system_prompt = _build_system_prompt(context, company_name, position, status)
    messages = _build_messages(system_prompt, history or [], question)

    stream = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.2,
        max_tokens=1500,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
