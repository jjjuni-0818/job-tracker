# ============================================================
# crawler.py — 공고 URL에서 텍스트 추출
# ============================================================

import requests
from bs4 import BeautifulSoup

def crawl_url(url: str) -> str:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()

        soup = BeautifulSoup(res.text, "html.parser")

        # script, style 태그 제거 (불필요한 코드 제거)
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # 텍스트만 추출하고 빈 줄 정리
        text = soup.get_text(separator="\n")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        result = "\n".join(lines)

        # 너무 길면 앞 3000자만 사용 (토큰 절약)
        return result[:3000]

    except Exception as e:
        print(f"크롤링 실패: {e}")
        return ""
