import { NextRequest, NextResponse } from "next/server";
import { AI_MODIFY_PROMPT } from "@/lib/constants";

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
    const { goalTitle, currentSteps, userMessage } = body as {
      goalTitle?: string;
      currentSteps?: { action: string; minutes: number; resultType: string }[];
      userMessage?: string;
    };

    if (!goalTitle || typeof goalTitle !== "string" || goalTitle.trim().length === 0) {
      return NextResponse.json(
        { error: "goalTitle is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!Array.isArray(currentSteps) || currentSteps.length === 0) {
      return NextResponse.json(
        { error: "currentSteps is required and must be a non-empty array." },
        { status: 400 }
      );
    }

    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return NextResponse.json(
        { error: "userMessage is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[datda] GEMINI_API_KEY not set. Returning mock response (currentSteps unchanged).");
      return NextResponse.json({
        steps: currentSteps,
      });
    }

    const stepsText = currentSteps
      .map((step, i) => `${i + 1}. ${step.action} (${step.minutes}분, ${step.resultType})`)
      .join("\n");

    const userPrompt = `목표: ${goalTitle.trim()}

현재 단계:
${stepsText}

사용자 요청: ${userMessage.trim()}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: AI_MODIFY_PROMPT }] },
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
    console.error("[datda] /api/modify-steps error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
