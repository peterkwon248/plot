import { NextRequest, NextResponse } from "next/server";
import { AI_SYSTEM_PROMPT, AI_DEEPEN_PROMPT } from "@/lib/constants";

interface StepRecommendation {
  action: string;
  minutes: number;
  resultType: string;
}

function parseAiResponse(text: string): StepRecommendation[] {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.steps)) {
        return parsed.steps.map((step: Record<string, unknown>) => ({
          action: String(step.action || ""),
          minutes: [15, 25, 30, 45, 60].includes(Number(step.minutes)) ? Number(step.minutes) : 30,
          resultType: ["업로드", "실행", "결정", "완성"].includes(String(step.resultType)) ? String(step.resultType) : "",
        })).filter((s: StepRecommendation) => s.action.length > 0);
      }
    }
  } catch {
    // Fall through
  }
  return [{ action: text.slice(0, 200), minutes: 30, resultType: "" }];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, context, previousSteps, round } = body as {
      goal?: string;
      context?: string;
      previousSteps?: string[];
      round?: number;
    };

    if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
      return NextResponse.json(
        { error: "goal is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[datda] GEMINI_API_KEY not set. Returning mock response.");
      return NextResponse.json({
        steps: [
          { action: "레퍼런스 자료 3개 스크린샷 저장하기", minutes: 25, resultType: "업로드" },
          { action: "핵심 내용 초안 작성하기", minutes: 30, resultType: "완성" },
          { action: "최종 결과물 완성하기", minutes: 45, resultType: "완성" },
        ],
      });
    }

    const isDeepening = Array.isArray(previousSteps) && previousSteps.length > 0 && (round ?? 0) > 1;

    let userPrompt = goal.trim();
    if (isDeepening) {
      userPrompt = `목표: ${goal.trim()}\n\n이전 ${round! - 1}회차에서 완료한 단계:\n${previousSteps!.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n위 단계를 모두 완료했습니다. ${round}회차 단계를 설계해주세요.`;
    } else if (context) {
      userPrompt = `[맥락: ${context.trim()}]\n\n${userPrompt}`;
    }

    const systemPrompt = isDeepening ? AI_DEEPEN_PROMPT : AI_SYSTEM_PROMPT;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`[datda] Gemini API error ${geminiResponse.status}:`, errorText);
      return NextResponse.json(
        { error: "AI 서비스에 문제가 발생했습니다." },
        { status: 502 }
      );
    }

    const data = await geminiResponse.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (!resultText) {
      return NextResponse.json({ error: "AI 응답을 처리할 수 없습니다." }, { status: 502 });
    }

    const steps = parseAiResponse(resultText.trim());
    return NextResponse.json({ steps });
  } catch (error) {
    console.error("[datda] /api/decompose error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
