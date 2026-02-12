"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { decomposeGoal } from "@/lib/gemini";
import { useDatdaStore } from "@/lib/store";
import Button from "@/components/ui/Button";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchParams = useSearchParams();
  const goalIdParam = searchParams.get("goalId");

  const goals = useDatdaStore((s) => s.goals);
  const addGoalWithSteps = useDatdaStore((s) => s.addGoalWithSteps);
  const setAiRecommendation = useDatdaStore((s) => s.setAiRecommendation);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const deepenTriggered = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-trigger deepening when ?goalId= param is present
  useEffect(() => {
    if (!mounted || !goalIdParam || deepenTriggered.current || loading) return;

    const matchingGoal = goals.find((g) => g.id === goalIdParam);
    if (!matchingGoal) return;

    const allCompleted = matchingGoal.steps.length > 0 && matchingGoal.steps.every((s) => s.completed);
    if (!allCompleted) return;

    deepenTriggered.current = true;

    const previousSteps = matchingGoal.steps.map((s) => s.action);
    const nextRound = (matchingGoal.round ?? 1) + 1;

    const userMessage: ChatMessage = {
      role: "user",
      content: `"${matchingGoal.title}" ${nextRound}회차 심화를 시작합니다.`,
    };
    setMessages([userMessage]);
    setLoading(true);

    (async () => {
      try {
        const result = await decomposeGoal(matchingGoal.title, undefined, previousSteps, nextRound);
        addGoalWithSteps(`${matchingGoal.title}`, result.steps, nextRound);

        const aiMessage: ChatMessage = {
          role: "ai",
          content: `${nextRound}회차 · ${result.steps.length}단계로 심화했습니다.\n서랍함에서 확인하세요.`,
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (result.steps.length > 0) {
          setAiRecommendation(result.steps[0]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "심화 중 오류가 발생했습니다. 다시 시도해주세요." },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, goalIdParam, goals, loading, addGoalWithSteps, setAiRecommendation]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (trimmed.length === 0 || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const goalContext = goals.length > 0 ? goals.map((g) => g.title).join(", ") : undefined;
      const result = await decomposeGoal(trimmed, goalContext);

      // Auto-save to vault
      addGoalWithSteps(trimmed, result.steps);

      // Show confirmation (not the steps list)
      const aiMessage: ChatMessage = {
        role: "ai",
        content: `${result.steps.length}단계로 쪼개서 서랍함에 넣었습니다.\n내일부터 하루에 하나씩 안내해드릴게요.`,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Set first step as recommendation
      if (result.steps.length > 0) {
        setAiRecommendation(result.steps[0]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        role: "ai",
        content:
          "응답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalClick = (title: string) => {
    setInput(title);
    setShowGoals(false);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto py-8 flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#e4e4e7] mb-2">
          {goalIdParam ? "프로젝트 심화" : "목표 쪼개기"}
        </h1>
        <p className="text-sm text-[#71717a]">
          {goalIdParam
            ? "이전 단계를 기반으로 더 깊은 단계를 설계합니다."
            : "큰 목표를 말해주세요. 매일 닫을 수 있는 단계로 쪼개드립니다."}
        </p>
      </div>

      {/* Vault Goals (collapsible) */}
      {goals.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowGoals((v) => !v)}
            className="text-xs text-[#71717a] hover:text-[#a78bfa] transition-colors duration-300 flex items-center gap-1 cursor-pointer"
          >
            <span
              className="inline-block transition-transform duration-200"
              style={{
                transform: showGoals ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              ▶
            </span>
            서랍함의 목표 ({goals.length})
          </button>

          <AnimatePresence>
            {showGoals && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-2">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalClick(goal.title)}
                      className="px-3 py-1.5 text-xs bg-[#141416] border border-[#27272a] rounded-full text-[#71717a] hover:border-[#a78bfa] hover:text-[#a78bfa] transition-colors duration-300 cursor-pointer"
                    >
                      {goal.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto mb-4 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#71717a]/60 text-center">
              큰 목표를 입력하면 매일 할 수 있는
              <br />
              구체적인 단계로 쪼개드립니다.
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#a78bfa] text-white rounded-br-sm"
                    : "bg-[#141416] text-[#e4e4e7] border border-[#27272a] rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                {/* Action buttons for AI messages */}
                {msg.role === "ai" && !msg.content.includes("오류") && (
                  <div className="mt-3 flex items-center gap-3">
                    <Link
                      href="/vault"
                      className="text-xs text-[#a78bfa] hover:text-[#b89dfc] transition-colors duration-300"
                    >
                      서랍함 보기 →
                    </Link>
                    <Link
                      href="/"
                      className="text-xs text-[#71717a] hover:text-[#a78bfa] transition-colors duration-300"
                    >
                      홈으로
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-[#141416] border border-[#27272a] rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-sm text-[#71717a] animate-pulse">
                ...
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="큰 목표를 입력하세요..."
          className="flex-1 px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa] transition-colors duration-300"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={input.trim().length === 0 || loading}
          className="shrink-0"
        >
          전송
        </Button>
      </div>
    </div>
  );
}
