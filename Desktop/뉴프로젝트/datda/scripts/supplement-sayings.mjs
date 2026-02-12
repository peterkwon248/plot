// 보충 생성 스크립트 - 기존 sayings.json에 추가
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadApiKey() {
  const envPath = resolve(__dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  return match[1].trim();
}

const API_KEY = loadApiKey();
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const PROMPT = `당신은 "datda(닫다)"라는 앱의 목소리를 만드는 작가입니다.

datda는 매일 하나의 작업을 "닫는" 앱입니다. 할 일 앱이 아니라 종료 장치입니다.

## 말투 규칙
- 한 문장, 최대 25자 이내
- 마침표(.)로 끝남
- 느낌표/물음표 금지
- 담백하고 조용한 톤
- 반말 또는 독백체 ("~하세요" 금지)
- 영어/이모지 금지
- 과한 칭찬/응원/재촉 금지
- 유명인 인용, 속담 금지

## 좋은 예시
- "오늘 것은 오늘만."
- "작아도 닫으면 된다."
- "급하지 않아도 괜찮다."
- "하루를 겨우 닫았다."
- "부족한 대로 닫는 하루."
- "오늘의 속도로 충분하다."
- "닫고 보니, 여기까지 왔다."
- "서두르지 않아도 괜찮다."

## 피해야 할 것
- "닫힘은 작은 X." 패턴 반복
- "하나의 X를 Y하다." 추상적 비유 (춤, 강, 별 등)
- "오늘의 닫힘, 내일의 X" 반복
- 과한 철학적/문학적 표현
- "~를 인도한다", "~를 엮는다" 등 과장

80개의 새로운 datda 문장을 만들어주세요. 일상적이고 소박한 톤으로.
JSON 배열만 반환. ["문장.", "문장.", ...]`;

async function main() {
  const sayingsPath = resolve(__dirname, "../lib/sayings.json");
  const existing = JSON.parse(readFileSync(sayingsPath, "utf-8"));
  const existingSet = new Set(existing);

  console.log(`기존: ${existing.length}개`);

  let newSayings = [];

  for (let i = 0; i < 2; i++) {
    console.log(`보충 배치 ${i + 1}/2 생성 중...`);
    const result = await model.generateContent(PROMPT);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const filtered = parsed.filter(
        (s) =>
          typeof s === "string" &&
          s.length >= 4 &&
          s.length <= 30 &&
          !s.includes("!") &&
          !s.includes("?") &&
          !/[a-zA-Z]{2,}/.test(s) &&
          !/하세요|합니다|해요|습니다|세요/.test(s) &&
          !/축하|대단|멋져|최고|화이팅|파이팅|힘내/.test(s) &&
          !existingSet.has(s.trim())
      );
      newSayings.push(...filtered);
      console.log(`  → ${filtered.length}개 추가`);
    }
    if (i < 1) await new Promise((r) => setTimeout(r, 5000));
  }

  const combined = [...existing, ...newSayings.map(s => s.endsWith(".") ? s : s + ".")];

  // 최종 중복 제거
  const unique = [...new Set(combined)];

  // 셔플
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  writeFileSync(sayingsPath, JSON.stringify(unique, null, 2), "utf-8");
  console.log(`\n최종: ${unique.length}개`);
}

main().catch(console.error);
