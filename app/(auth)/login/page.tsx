"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Supabase 미설정 시 안내
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-[360px] text-center space-y-4">
          <h1 className="text-[24px] leading-[32px] tracking-[-0.02em] font-semibold">
            ◆ Plot
          </h1>
          <p className="text-text-secondary text-[14px] leading-[20px]">
            Supabase가 설정되지 않았습니다.
            <br />
            현재 localStorage 모드로 동작 중입니다.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-10 bg-accent text-white rounded-lg text-[14px] leading-[20px] font-medium hover:bg-accent-hover transition-colors"
          >
            앱으로 이동
          </button>
          <p className="text-text-tertiary text-[12px] leading-[16px]">
            Supabase 연동은 .env.local 파일을 설정하면 활성화됩니다.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase 클라이언트를 생성할 수 없습니다.");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("확인 이메일을 발송했습니다. 메일함을 확인하세요.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-bg-primary">
      <div className="w-[360px] space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-[24px] leading-[32px] tracking-[-0.02em] font-semibold">
            ◆ Plot
          </h1>
          <p className="text-text-secondary text-[14px] leading-[20px]">
            {isSignUp ? "계정 만들기" : "로그인"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-[14px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            minLength={6}
            className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-[14px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
          />

          {error && (
            <p className="text-[12px] leading-[16px] text-priority-urgent">
              {error}
            </p>
          )}
          {message && (
            <p className="text-[12px] leading-[16px] text-accent">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-accent text-white rounded-lg text-[14px] leading-[20px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading
              ? "처리 중..."
              : isSignUp
                ? "회원가입"
                : "로그인"}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
            }}
            className="text-[13px] leading-[20px] text-text-secondary hover:text-text-primary transition-colors"
          >
            {isSignUp
              ? "이미 계정이 있으신가요? 로그인"
              : "계정이 없으신가요? 회원가입"}
          </button>
        </div>
      </div>
    </div>
  );
}
