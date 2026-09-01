import { useEffect, useState } from "react"

import type { User } from "@supabase/supabase-js"

import { supabase } from "../lib/supabase"

// Plasmo Content Script: YouTube 페이지에 "Pind에 저장" 플로팅 버튼 주입
export const config = {
  matches: ["https://www.youtube.com/*", "https://youtu.be/*"],
}

export default function YoutubeContent() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // 로그인하지 않은 경우 버튼 미표시
  if (!user) return null

  const handleSave = async () => {
    const url = window.location.href
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) return

    setSubmitting(true)
    await supabase
      .from("videos")
      .insert({ url, user_id: user.id, status: "pending" })
    setSubmitting(false)
    setSubmitted(true)

    setTimeout(() => {
      setSubmitted(false)
      setOpen(false)
    }, 2500)
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 2147483647,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {open ? (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          width: 240,
        }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15 }}>📍 Pind</p>
          {submitted ? (
            <p style={{ fontSize: 13, color: "#22c55e", margin: 0 }}>
              저장 완료! Pind에서 지도를 확인하세요.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#374151", margin: "0 0 12px" }}>
                이 영상의 장소를 추출하시겠어요?
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: submitting ? "#9ca3af" : "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "저장 중..." : "장소 추출"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "8px 12px",
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          📍 Pind에 저장
        </button>
      )}
    </div>
  )
}
