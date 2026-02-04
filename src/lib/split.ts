// src/lib/split.ts
export type PairRow = {
    index: number;
    sentence: string;
    promptEn: string;
  };
  
  /**
   * 입력 텍스트에서 "문장/프롬프트" 쌍을 뽑아 scenes로 만들기 좋게 반환
   * 지원 패턴 예:
   *  - 문장 007: ...
   *  - 프롬프트 007: ...
   *  - [한국어 번역] ... [영어 이미지 프롬프트] ...
   */
  export function parseScriptToPairs(raw: string): PairRow[] {
    const lines = (raw || "").replace(/\r\n/g, "\n").split("\n");
  
    const sentenceRe = /^\s*(?:문장|자막)\s*\d*\s*[:：]\s*(.+)\s*$/i;
    const promptRe = /^\s*(?:프롬프트|prompt)\s*\d*\s*[:：]\s*(.+)\s*$/i;
  
    const rows: PairRow[] = [];
    let pendingSentence: string | null = null;
  
    function pushPair(sentence: string, prompt: string) {
      const s = (sentence || "").trim();
      const p = (prompt || "").trim();
      if (!s && !p) return;
      rows.push({ index: rows.length + 1, sentence: s, promptEn: p });
    }
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
  
      // 1) [한국어 번역] ... [영어 이미지 프롬프트] ... 형태(한 줄/여러 줄 섞여도 최대한 대응)
      if (line.includes("[한국어") && line.includes("[영어")) {
        // 한 덩어리로 합쳐서 처리
        let chunk = line;
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "") {
          chunk += " " + lines[j].trim();
          j++;
        }
        i = j;
  
        const ko = extractBetween(chunk, "[한국어", "[영어") || "";
        const en = extractAfter(chunk, "[영어") || "";
        pushPair(cleanLabel(ko), cleanLabel(en));
        pendingSentence = null;
        continue;
      }
  
      // 2) 문장 라인
      const sm = line.match(sentenceRe);
      if (sm) {
        pendingSentence = cleanLabel(sm[1]);
        continue;
      }
  
      // 3) 프롬프트 라인
      const pm = line.match(promptRe);
      if (pm) {
        const prompt = cleanLabel(pm[1]);
        if (pendingSentence != null) {
          pushPair(pendingSentence, prompt);
          pendingSentence = null;
        } else {
          // 문장 없이 프롬프트만 들어온 경우도 방어
          pushPair("", prompt);
        }
        continue;
      }
  
      // 4) 그냥 문장만 연속으로 들어오는 경우: 빈 줄 기준으로 문장 덩어리
      //    (사용자가 문장만 붙여넣는 케이스 대비)
      if (line && !pendingSentence) {
        pendingSentence = cleanLabel(line);
        continue;
      }
      if (!line && pendingSentence) {
        pushPair(pendingSentence, "");
        pendingSentence = null;
      }
    }
  
    if (pendingSentence) pushPair(pendingSentence, "");
  
    // 빈 row 제거 + 번호 정리
    return rows
      .map((r, idx) => ({ ...r, index: idx + 1 }))
      .filter((r) => r.sentence.trim() || r.promptEn.trim());
  }
  
  function cleanLabel(s: string) {
    return (s || "")
      .replace(/^\s*(?:문장|자막|프롬프트|prompt)\s*\d*\s*[:：]\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  function extractBetween(text: string, leftStartsWith: string, rightStartsWith: string) {
    const li = text.indexOf(leftStartsWith);
    const ri = text.indexOf(rightStartsWith);
    if (li < 0 || ri < 0 || ri <= li) return "";
    // "[한국어 번역]" 같은 케이스라 ":" 이후를 더 우선
    const leftColon = text.indexOf("]", li);
    const start = leftColon >= 0 ? leftColon + 1 : li + leftStartsWith.length;
    return text.slice(start, ri).trim();
  }
  
  function extractAfter(text: string, rightStartsWith: string) {
    const ri = text.indexOf(rightStartsWith);
    if (ri < 0) return "";
    const rightClose = text.indexOf("]", ri);
    const start = rightClose >= 0 ? rightClose + 1 : ri + rightStartsWith.length;
    return text.slice(start).trim();
  }
  