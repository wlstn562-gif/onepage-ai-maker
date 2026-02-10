# Project Status Handover: Passport Photo Auto-Detection Logic

## 1. Project Goal
- **Objective**: Automate the creation of passport photos (3.5cm x 4.5cm) from user-uploaded images.
- **Key Requirement**: Precisely detect the **Crown (Top of Head)** and **Chin (Bottom of Chin)** to apply strict passport layout rules (Headroom 30px, Chin-Bottom 125px).
- **Current Tech Stack**: Next.js, `face-api.js` (SSD MobileNet V1).

## 2. Current Implementation Status (`src/app/analyze/page.tsx`)
- **Auto-Detection Logic**:
    - **Model**: `face-api.detectSingleFace` with `SsdMobilenetv1Options`.
    - **Landmarks**: Used to calculate positions based on facial features (eyebrows, chin).
- **Current Tuning Values (As of Step 1037)**:
    - **Crown (Top)**: `eyebrowsY - (faceLength * 0.68)`
        - *History*: 0.75 (Too high) -> 0.55 (Too low) -> 0.65 (Low) -> 0.72 (High) -> 0.8 (Hybrid attempt) -> 0.7 (Fixed) -> **0.68 (Fine-tuned)**.
    - **Chin (Bottom)**: `chinPoint.y + (faceLength * 0.06)`
        - *Reason*: Raw landmark #8 is often too high (on the chin bone), so +6% offset added to cover soft tissue/double chin.
- **UI UX**:
    - Loading: Unified "Black Pill" notification (`얼굴 찾는 중...`).
    - Manual Mode: If detection fails, user manually clicks Crown -> Chin. `FaceBox` is auto-calculated from these two points.

## 3. The Problem (Why Handing Over)
- **Inconsistent Crown Detection**:
    - The logical formula `eyebrows - faceLen * Ratio` works for "average" faces but fails on:
        - High volume hair / Up-style hair (Ratio needs to be higher).
        - Large foreheads or balding (Ratio needs to be lower).
    - **User Feedback**: "One person works well, the next person is cut off, the third has too much space."
- **Failed Hybrid Approach**:
    - Tried using `Math.min(estimatedCrownY, detectionBox.y)` to fallback to the bounding box for big hair.
    - Result: `detectionBox.y` itself was unstable or too high/low depending on the model's confidence, leading to erratic behavior.

## 4. Request for Claude Code
- **Objective**: Propose a more robust algorithm or UX solution to handle **individual variances in head shape/hair volume**.
- **Suggestions to Explore**:
    1.  **Semantic Segmentation**: Use a body-pix or hair-segmentation model instead of simple bounding boxes? (Might be heavy for client-side).
    2.  **Advanced Heuristics**: Is there a better landmark ratio utilizing the nose or eye line?
    3.  **Interactive UX**: Maybe show *three* candidate crop lines and let the user pick one? (Low/Mid/High).
    4.  **Backend Analysis**: Move detection to a server-side Python (Dlib/OpenCV) if client JS is too limited?

## 5. Relevant Code Snippet (`src/app/analyze/page.tsx`)

```typescript
// Current Logic in detectFace()
const landmarks = detection.landmarks;
const chinPoint = landmarks.positions[8];

// Estimate Crown using Landmarks
const eyebrowsY = (landmarks.positions[19].y + landmarks.positions[24].y) / 2;
const faceLen = chinPoint.y - eyebrowsY;

// Ratio: 0.68 (The current "best fit" for user's test cases)
const estimatedCrownY = eyebrowsY - faceLen * 0.68;

// Chin Offset: 6% padding
const chinOffsetY = chinPoint.y + faceLen * 0.06;

setChin({ x: chinPoint.x, y: chinOffsetY });
setCrown({ x: cx, y: estimatedCrownY });
```

---

# UPDATE LOG (2026-02-10) — Claude Code 적용 내역

> 아래는 위 핸드오버 문서의 요청사항(Section 4)에 대한 실제 구현 결과입니다.
> 기존 코드/문서는 백업 용도로 위에 그대로 유지합니다.

---

## 6. 적용된 해결책: Multi-Signal Median Fusion

### 6.1 문제 분석

| 기존 방식 | 문제점 |
|-----------|--------|
| 단일 비율 `eyebrowsY - faceLen * 0.68` | 평균 얼굴에만 맞음 |
| `Math.min(landmark, box.y)` 하이브리드 | box.y 자체가 불안정 → 이상치에 취약 |

**핵심 원인**: 단일 신호(signal)에 의존하면, 그 신호가 틀렸을 때 보정 수단이 없음.

### 6.2 해결: 3-Signal Median (중앙값)

3개의 **독립적인** 정수리 추정 방법을 사용하고, **중앙값**을 취함.
→ 하나가 이상치(outlier)여도 나머지 2개가 보정.

```typescript
// Signal 1: 기존 비율 방식 (평균 얼굴에 안정적)
const crownByRatio = eyebrowsY - faceLen * 0.68;

// Signal 2: SSD MobileNet 바운딩박스 상단 (머리숱 포함)
// 박스가 머리카락까지 잡으므로 큰 머리에 유리
const crownByBox = box.y + box.height * 0.03;

// Signal 3: 이마 비례 외삽 (인체비례 기반)
// 코끝~눈썹 거리 ≈ 눈썹~헤어라인 거리 (해부학적 비례)
const noseToEyebrow = Math.abs(eyebrowsY - noseTip.y);
const crownByForehead = eyebrowsY - noseToEyebrow * 1.15;

// 중앙값 선택 (이상치 1개에 영향받지 않음)
const sorted = [crownByRatio, crownByBox, crownByForehead].sort((a, b) => a - b);
const estimatedCrownY = sorted[1]; // median
```

### 6.3 왜 Median인가?

| 시나리오 | Signal 1 (비율) | Signal 2 (박스) | Signal 3 (이마) | Median 결과 |
|----------|----------------|----------------|----------------|-------------|
| 평균 얼굴 | 정확 | 정확 | 정확 | 정확 |
| 머리숱 많음 | 너무 낮음 | 정확 (박스가 머리 잡음) | 약간 낮음 | 중간 → OK |
| 대머리/짧은머리 | 너무 높음 | 불안정 | 정확 (이마비례) | 중간 → OK |
| 박스 이상치 | 정확 | 이상치 | 정확 | 정확 (이상치 무시) |

**기존 `Math.min` 방식과의 차이**: `Math.min`은 가장 극단적인 값에 끌려가지만, Median은 중간값이므로 안정적.

---

## 7. 적용된 UX 개선

### 7.1 동적 미세조정 (Dynamic Nudge)

**기존**: 고정 3px 이동 → 머리 400px 기준 0.75%, 체감 불가
**변경**: 머리 길이의 2% 동적 스텝 → 머리 400px 기준 ~8px, 체감 가능

```typescript
function nudgePoint(which: 'crown' | 'chin', direction: number) {
    const headLen = Math.abs(chin.y - crown.y);
    const step = Math.max(4, Math.round(headLen * 0.02)); // 2% of head
    const dy = direction * step;
    // ...
}
```

### 7.2 정수리 빠른 조정 버튼 (Crown Candidates)

핸드오버 Section 4.3 제안("3개 후보선 보여주기")을 변형 적용:

| 버튼 | 동작 | 대상 |
|------|------|------|
| 머리숱 많음 ↑ | 정수리를 위로 8% 이동 | 볼륨 머리, 업스타일 |
| 기본 (재감지) | detectFace() 재실행 | 초기화/리셋 |
| 짧은머리/대머리 ↓ | 정수리를 아래로 8% 이동 | 짧은머리, 대머리 |

→ 자동 감지 후 한 번의 클릭으로 빠르게 보정 가능.

### 7.3 실시간 크롭 미리보기 (Live Preview)

- 정수리/턱끝 조정할 때마다 **413×531 규격 결과물을 우측 패널에 실시간 표시**
- 파란 점선으로 정수리(30px) / 턱끝(406px) 기준선 시각화
- 다운로드 전에 정확한 결과 확인 가능
- `useCallback` + `useEffect`로 crown/chin 변경 시 자동 갱신

```typescript
const generatePreview = useCallback(() => {
    // 413x531 캔버스에 scale/offset 계산 후 렌더링
    // 가이드 점선(30px, 406px) 오버레이
    setPreviewUrl(out.toDataURL('image/jpeg', 0.85));
}, [crown, chin, fileUrl]);
```

---

## 8. 핸드오버 요청사항 대응 현황

| Section 4 제안 | 상태 | 구현 방식 |
|----------------|------|-----------|
| 1. Semantic Segmentation | 미적용 | 클라이언트 부담 큼, 현재 Median으로 충분히 개선 |
| 2. Advanced Heuristics (코/눈 활용) | **적용** | Signal 3: 코끝~눈썹 거리 기반 이마 외삽 |
| 3. Interactive UX (3개 후보선) | **적용** | 머리숱 많음/기본/짧은머리 빠른 조정 버튼 |
| 4. Backend Analysis (Python) | 미적용 | 클라이언트 Median 방식으로 우선 해결 |

---

## 9. 변경된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/analyze/page.tsx` | Multi-signal crown detection, dynamic nudge, crown candidates, live preview |
| `to_claude_handover.md` | 이 업데이트 로그 추가 |

---

## 10. 남은 과제 / 추후 개선

1. **테스트 필요**: 다양한 얼굴(머리숱 많음, 대머리, 유아, 안경)로 Median 방식 검증
2. **Signal 가중치 튜닝**: 현재 동일 가중 Median, 필요시 Weighted Median 고려
3. **Semantic Segmentation**: Median으로도 부족한 극단적 케이스 발생 시 body-pix 도입 검토
4. **서버사이드 백업**: Dlib/OpenCV 기반 서버 API를 fallback으로 준비 (정확도 최우선 케이스)
5. **턱끝 감지 개선**: 현재 6% offset은 대부분 OK이나, 이중턱/각진턱 케이스 추가 검증 필요
