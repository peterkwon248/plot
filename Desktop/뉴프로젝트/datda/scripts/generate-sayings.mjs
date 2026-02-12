// ============================================================
// datda - 문장 생성 스크립트
// Gemini API를 사용하여 datda 목소리의 문장 1000+개 생성
// 실행: node scripts/generate-sayings.mjs
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local에서 API 키 읽기
function loadApiKey() {
  const envPath = resolve(__dirname, "../.env.local");
  if (!existsSync(envPath)) {
    console.error(".env.local 파일을 찾을 수 없습니다.");
    process.exit(1);
  }
  const envContent = readFileSync(envPath, "utf-8");
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (!match) {
    console.error("GEMINI_API_KEY를 찾을 수 없습니다.");
    process.exit(1);
  }
  return match[1].trim();
}

const API_KEY = loadApiKey();
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ============================================================
// datda 목소리 정의 프롬프트 (핵심)
// ============================================================
const DATDA_VOICE_PROMPT = `당신은 "datda(닫다)"라는 앱의 목소리를 만드는 작가입니다.

## datda란?
- "닫다"는 한국어로 "close"라는 뜻입니다.
- 매일 하나의 작업을 "닫는" 것으로 하루를 마무리하는 앱입니다.
- 할 일 앱이 아닙니다. "종료 장치"입니다.
- 핵심 감정: "오늘도 하나를 닫았다. 오늘을 헛되이 보내지 않았다."

## datda의 말투 규칙 (엄격히 준수)

### 반드시 지켜야 할 것:
1. 짧다. 한 문장. 최대 20자 이내가 이상적이고, 절대 30자를 넘기지 않는다.
2. 담백하다. 감정을 절제한다. 담담하게.
3. 마침표(.)로 끝난다. 물음표, 느낌표 절대 금지.
4. "닫다/닫음/닫힘" 관련 표현을 자연스럽게 활용한다.
5. 한국어 맞춤법이 완벽해야 한다. 오타 절대 금지.
6. 반말 또는 독백체. ("~하세요", "~합니다" 금지)
7. 여운이 있다. 읽고 나면 잠시 생각하게 된다.

### 절대 하지 말아야 할 것:
1. 느낌표(!) 금지. 하나도 안 된다.
2. 이모지/이모티콘 금지.
3. "축하", "대단", "멋져", "최고" 등 과한 칭찬 금지.
4. "화이팅", "힘내", "파이팅", "열심히" 등 응원 금지.
5. "스트릭", "연속", "기록 갱신" 등 성과 압박 금지.
6. "해야 한다", "해라", "빨리" 등 재촉/명령 금지.
7. "목표 달성", "성공", "성취" 등 성과주의 표현 금지.
8. 영어 단어 금지. 순한국어만.
9. 유명인 인용, 속담, 격언 금지. datda만의 말.
10. 비유가 과하면 안 된다. 소박하게.
11. "~하자", "~해보자" 등 제안/권유 금지.
12. 질문형 금지. 물음표 금지.
13. 두 문장 이상 금지. 오직 한 문장.

## 좋은 예시 (이 톤을 유지):
- "하루에 하나, 느리지만 분명하게."
- "오늘 것은 오늘만."
- "작아도 닫으면 된다."
- "급하지 않아도 괜찮다."
- "완벽하지 않아도, 닫으면 된다."
- "어제의 나보다 한 걸음."
- "천천히, 그러나 멈추지 않고."
- "오늘도 하나를 닫는 사람."
- "시작이 아니라 종료가 힘이다."
- "하나를 끝내는 것이 열 개를 시작하는 것보다 낫다."

## 나쁜 예시 (이런 건 절대 안 됨):
- "오늘도 화이팅!" (느낌표, 응원)
- "3일 연속 달성! 대단해요!" (성과 압박, 과한 칭찬)
- "오늘 할 일이 5개 남았습니다." (재촉, 존댓말)
- "Success is a journey, not a destination." (영어)
- "천 리 길도 한 걸음부터." (속담/격언)
- "포기하지 마세요!" (응원, 느낌표, 존댓말)

## 문장 카테고리 (골고루 분포):
1. 닫음/종료/마무리 (30%)
2. 느림/여유/천천히 (15%)
3. 하나에 집중 (15%)
4. 불완전해도 괜찮다 (10%)
5. 오늘 하루 (10%)
6. 쌓임/흔적 (10%)
7. 멈추지 않음/이어감 (5%)
8. 시작보다 마무리 (5%)`;

// ============================================================
// 배치별 생성 요청
// ============================================================
const BATCH_SIZE = 120; // 배치당 생성 수 (여유있게)
const TOTAL_BATCHES = 11; // 11 * 120 = 1320 (중복 제거 후 1000+ 목표)
const DELAY_MS = 5000; // 배치 간 딜레이 (5초, rate limit 대응)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateBatch(batchNumber) {
  const categoryFocus = [
    "닫음, 종료, 마무리에 대한 문장 위주로",
    "느림, 여유, 천천히에 대한 문장 위주로",
    "하나에 집중하는 것에 대한 문장 위주로",
    "불완전해도 괜찮다는 문장 위주로",
    "오늘 하루에 대한 문장 위주로",
    "쌓임, 흔적, 기록에 대한 문장 위주로",
    "멈추지 않고 이어가는 것에 대한 문장 위주로",
    "시작보다 마무리가 중요하다는 문장 위주로",
    "조용한 일상과 작은 행동에 대한 문장 위주로",
    "기다림, 과정의 가치에 대한 문장 위주로",
    "모든 카테고리를 골고루 섞어서",
  ];

  const focus = categoryFocus[batchNumber % categoryFocus.length];

  const prompt = `${DATDA_VOICE_PROMPT}

## 이번 요청
${BATCH_SIZE}개의 datda 문장을 생성해주세요. ${focus} 생성해주세요.

## 출력 형식
반드시 JSON 배열만 반환하세요. 다른 텍스트 없이.
["문장1.", "문장2.", "문장3.", ...]

## 추가 규칙
- 이전에 나온 예시와 겹치지 않는 새로운 문장만.
- 각 문장은 반드시 마침표(.)로 끝나야 한다.
- 한 문장이 30자를 넘으면 안 된다.
- 맞춤법 오류 절대 금지.
- 비슷한 문장 반복 금지. 모든 문장이 독립적이어야 한다.
- "~하세요", "~합니다", "~해요" 등 존댓말 금지.
- 느낌표(!) 하나도 포함되면 안 된다.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // JSON 파싱
  try {
    // JSON 블록 추출 (```json ... ``` 또는 순수 배열)
    let jsonStr = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((s) => typeof s === "string" && s.trim().length > 0);
    }
  } catch (e) {
    console.error(`배치 ${batchNumber + 1} 파싱 실패:`, e.message);
    // 줄바꿈으로 분리 시도
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[\d.\-*"\s]+/, "").replace(/[",\s]+$/, "").trim())
      .filter((l) => l.length > 0 && l.length < 50 && !l.startsWith("[") && !l.startsWith("{"));
    return lines;
  }

  return [];
}

// ============================================================
// 품질 필터
// ============================================================
function qualityFilter(sayings) {
  return sayings.filter((s) => {
    // 타입 체크
    if (typeof s !== "string") return false;

    const trimmed = s.trim();

    // 빈 문장
    if (trimmed.length === 0) return false;

    // 너무 짧거나 너무 긴 문장
    if (trimmed.length < 4 || trimmed.length > 35) return false;

    // 느낌표 포함
    if (trimmed.includes("!")) return false;

    // 물음표 포함
    if (trimmed.includes("?")) return false;

    // 이모지 포함 (기본 이모지 범위)
    if (/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}]/u.test(trimmed)) return false;

    // 영어 포함 (알파벳 2글자 이상 연속)
    if (/[a-zA-Z]{2,}/.test(trimmed)) return false;

    // 존댓말 패턴
    if (/하세요|합니다|해요|드립니다|됩니다|습니다|세요|에요/.test(trimmed)) return false;

    // 과한 칭찬/응원
    if (/축하|대단|멋져|최고|화이팅|파이팅|힘내|열심히|짱|완벽해/.test(trimmed)) return false;

    // 성과 압박
    if (/스트릭|연속|기록 갱신|달성률|몇 번째/.test(trimmed)) return false;

    // 재촉
    if (/빨리|서둘러|어서|당장|지금 당장/.test(trimmed)) return false;

    // 마침표로 끝나는지 (끝에 마침표 없으면 추가하지 말고 그냥 통과)
    // 마침표가 없어도 일단 포함 (나중에 추가)

    return true;
  }).map((s) => {
    let trimmed = s.trim();
    // 마침표로 끝나지 않으면 추가
    if (!trimmed.endsWith(".")) {
      trimmed += ".";
    }
    // 앞뒤 따옴표 제거
    trimmed = trimmed.replace(/^["']+|["']+$/g, "");
    if (!trimmed.endsWith(".")) {
      trimmed += ".";
    }
    return trimmed;
  });
}

// ============================================================
// 중복 제거
// ============================================================
function deduplicate(sayings) {
  const seen = new Set();
  const result = [];

  for (const s of sayings) {
    // 정규화: 공백 통일, 소문자 비교용
    const normalized = s.replace(/\s+/g, " ").trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  console.log("=== datda 문장 생성 시작 ===");
  console.log(`목표: ${BATCH_SIZE} x ${TOTAL_BATCHES} = ${BATCH_SIZE * TOTAL_BATCHES}개 (중복 제거 전)`);
  console.log("");

  let allSayings = [];

  // 기존 DATDA_SAYINGS 포함
  const existingSayings = [
    "하루에 하나, 느리지만 분명하게.",
    "오늘 것은 오늘만.",
    "작아도 닫으면 된다.",
    "급하지 않아도 괜찮다.",
    "하나를 끝내는 것이 열 개를 시작하는 것보다 낫다.",
    "완벽하지 않아도, 닫으면 된다.",
    "어제의 나보다 한 걸음.",
    "천천히, 그러나 멈추지 않고.",
    "오늘도 하나를 닫는 사람.",
    "시작이 아니라 종료가 힘이다.",
  ];

  allSayings.push(...existingSayings);

  for (let i = 0; i < TOTAL_BATCHES; i++) {
    console.log(`배치 ${i + 1}/${TOTAL_BATCHES} 생성 중...`);

    try {
      const batch = await generateBatch(i);
      console.log(`  → ${batch.length}개 생성됨`);
      allSayings.push(...batch);
    } catch (error) {
      console.error(`  → 배치 ${i + 1} 실패:`, error.message);
      // 실패 시 재시도 1회
      console.log("  → 10초 후 재시도...");
      await sleep(10000);
      try {
        const batch = await generateBatch(i);
        console.log(`  → 재시도 성공: ${batch.length}개`);
        allSayings.push(...batch);
      } catch (retryError) {
        console.error(`  → 재시도도 실패. 건너뜀.`);
      }
    }

    // Rate limit 대응 딜레이
    if (i < TOTAL_BATCHES - 1) {
      console.log(`  → ${DELAY_MS / 1000}초 대기...`);
      await sleep(DELAY_MS);
    }
  }

  console.log("");
  console.log(`총 생성: ${allSayings.length}개 (필터링 전)`);

  // 품질 필터링
  const filtered = qualityFilter(allSayings);
  console.log(`품질 필터 후: ${filtered.length}개`);

  // 중복 제거
  const unique = deduplicate(filtered);
  console.log(`중복 제거 후: ${unique.length}개`);

  // 셔플
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  // 저장
  const outputPath = resolve(__dirname, "../lib/sayings.json");
  writeFileSync(outputPath, JSON.stringify(unique, null, 2), "utf-8");

  console.log("");
  console.log(`=== 완료 ===`);
  console.log(`저장 위치: ${outputPath}`);
  console.log(`최종 문장 수: ${unique.length}개`);
  console.log("");
  console.log("샘플 (처음 10개):");
  unique.slice(0, 10).forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
