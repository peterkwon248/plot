// ============================================================
// datda - 2차 품질 필터 스크립트
// 생성된 문장에서 datda 톤에 맞지 않는 문장 제거
// 실행: node scripts/filter-sayings.mjs
// ============================================================

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = resolve(__dirname, "../lib/sayings.json");
const outputPath = resolve(__dirname, "../lib/sayings.json");

const sayings = JSON.parse(readFileSync(inputPath, "utf-8"));
console.log(`입력: ${sayings.length}개`);

// ============================================================
// 2차 필터 규칙
// ============================================================

// 어색하거나 datda 톤에 맞지 않는 패턴들
const BAD_PATTERNS = [
  // 너무 추상적이고 의미 없는 비유
  /하나의 (춤|강|바다|산|새|꽃|별|하늘|비|눈|구름|나무|나비|노래|음악|색|빛|향기|바람|파도|땅|돌|불|불꽃|재능|비밀|꿈|영혼|마법|기적|축복|선물|보물|모험|여행|전설|이야기|날개|시|그림|예술)/,
  // "~를 V하다" 형태의 너무 추상적인 문장
  /하나의 (춤을|강을|바다를|산을|새를|비밀을|날개를|시를|그림을) /,
  // "닫힘은 X의 Y" 반복 패턴 중 어색한 것
  /닫힘은 (기다림의 해|기다림의 강|기다림의 바다|기다림의 산|나를 위한 모험|나를 위한 주문|나를 위한 미래|나를 위한 마법|나를 위한 축복|나를 위한 선물|나를 위한 기적|삶의 리듬|삶의 춤|가치의 발견)/,
  // "닫힘은 작은 X" 과다 반복 (일부만 남기기 위해 어색한 것 제거)
  /닫힘은 작은 (속삭임|설렘|추억|기도|마법|기적|축복|약속|선물|모험|희망|여행)/,
  // 너무 뻔한 동어반복
  /닫힘은 닫힘/,
  // "닫는 것은 나를 위한 X" 패턴 (과한 자기애)
  /닫는 것은 나를 위한/,
  // "닫음으로써" 패턴 (너무 설명적/교훈적)
  /닫음으로써 (자신감|용기|힘|에너지|지혜|깨달음|성장|성숙|변화|자유|해방)/,
  // "오늘의 닫힘, 내일의 X" 과다반복
  /오늘의 닫힘, 내일의 (도약|도전|기대|발돋움|에너지|시작|열림|희망|기적|마법)/,
  // 과한 문학적 표현
  /닫힘은 (과정의 열매|시간을 담는 그릇|과정의 거울|기다림의 마침표|기다림의 연료|기다림의 친구|기다림의 가치)/,
  // "~를 인도한다", "~를 엮는다" 등 과장
  /(인도한다|엮는다|인도하다|엮다)/,
  // 성취/성장/발전 등 성과주의 뉘앙스
  /성장하다|발전하다|진보하다|향상하다|강해지다|발휘하다/,
  // 도전/모험 등 자기계발서 톤
  /도전을 (준비|맞이|시작)|모험을|전투를|승리를/,
  // "~를 보상받다", "~를 증명" 등
  /보상받다|증명하다|증명\./,
  // 문법적으로 어색한 것
  /닫힘은 기다림의 해\./,
  // "계속 닫자", "~하자" 등 제안/권유 (필터에 빠진 것)
  /닫자\./,
  // "고생했어" 등 칭찬
  /고생했어|수고했어|잘했어|대견해/,
];

// 특정 문장 직접 제거 (수동 블랙리스트)
const BLACKLIST = new Set([
  "하나의 춤을 추다.",
  "하나의 강을 건너다.",
  "하나의 재능을 발휘하다.",
  "하나의 비밀을 간직하다.",
  "하나의 추억을 만들다.",
  "하나의 한계를 넘다.",
]);

// 유사도 체크: 앞 8글자가 같으면 비슷한 문장으로 간주
function removeSimilar(arr) {
  const result = [];
  const prefixes = new Map(); // prefix -> count

  for (const s of arr) {
    const prefix = s.slice(0, 8);
    const count = prefixes.get(prefix) || 0;

    // 같은 접두사 문장이 3개 이상이면 스킵
    if (count >= 3) continue;

    prefixes.set(prefix, count + 1);
    result.push(s);
  }

  return result;
}

// 필터 적용
let filtered = sayings.filter((s) => {
  // 블랙리스트
  if (BLACKLIST.has(s)) return false;

  // 패턴 매칭
  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(s)) return false;
  }

  return true;
});

console.log(`패턴 필터 후: ${filtered.length}개`);

// 유사도 필터
filtered = removeSimilar(filtered);
console.log(`유사도 필터 후: ${filtered.length}개`);

// 셔플
for (let i = filtered.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
}

// 저장
writeFileSync(outputPath, JSON.stringify(filtered, null, 2), "utf-8");

console.log(`\n=== 완료 ===`);
console.log(`최종: ${filtered.length}개`);
console.log("\n샘플 (무작위 20개):");
const sample = [...filtered].sort(() => Math.random() - 0.5).slice(0, 20);
sample.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
