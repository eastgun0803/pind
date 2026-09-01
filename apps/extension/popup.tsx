import { useEffect, useState } from "react"

import type { User } from "@supabase/supabase-js"

import { useVideoStatus } from "./hooks/useVideoStatus"
import { supabase } from "./lib/supabase"
import { useVideoStore } from "./stores/videoStore"

// Plasmo popup (380×600 기준). CSP 엄격: inline <script>/eval 금지. next/* import 금지.
// 인라인 style 허용.

const STATUS_LABELS: Record<string, string> = {
  pending: "대기 중...",
  processing: "장소 추출 중...",
  completed: "완료! Pind 웹에서 지도를 확인하세요.",
  failed: "처리 실패. 다시 시도해주세요.",
}

function IndexPopup() {
  const [user, setUser] = useState<User | null>(null)
  const [url, setUrl] = useState("")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const { latestVideoId, setLatestVideoId } = useVideoStore()
  const pipelineStatus = useVideoStatus(latestVideoId)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be")
  const disabled = submitStatus === "submitting" || !isYoutube

  const handleSubmit = async () => {
    if (!user) { setError("Pind에 로그인해주세요."); return }
    if (!isYoutube) { setError("YouTube URL만 지원합니다."); return }

    setSubmitStatus("submitting")
    setError(null)

    const { data, error: dbError } = await supabase
      .from("videos")
      .insert({ url, user_id: user.id, status: "pending" })
      .select("id")
      .single()

    if (dbError || !data) {
      setError(dbError?.message ?? "알 수 없는 오류")
      setSubmitStatus("error")
    } else {
      setLatestVideoId((data as { id: string }).id)
      setSubmitStatus("done")
      setUrl("")
    }
  }

  const statusColor =
    pipelineStatus === "failed" ? "#ef4444"
    : pipelineStatus === "completed" ? "#22c55e"
    : "#6b7280"

  return (
    <div style={{
      width: 380,
      minHeight: 240,
      padding: 16,
      boxSizing: "border-box",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Pind</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
        유튜브 URL을 입력해 장소를 추출하세요
      </p>

      {user ? (
        <>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              width: "100%",
              marginTop: 12,
              padding: "7px 10px",
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "9px 0",
              background: disabled ? "#9ca3af" : "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {submitStatus === "submitting" ? "처리 중..." : "장소 추출"}
          </button>

          {error && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{error}</p>
          )}

          {latestVideoId && pipelineStatus && (
            <p style={{ fontSize: 12, color: statusColor, marginTop: 8 }}>
              {STATUS_LABELS[pipelineStatus]}
            </p>
          )}

          {submitStatus === "done" && !pipelineStatus && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              제출 완료! 잠시 후 지도에 장소가 표시됩니다.
            </p>
          )}

          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16 }}>
            {user.email}
          </p>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "#374151", marginTop: 16 }}>
          <a
            href="https://pind.vercel.app/login"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#111827", textDecoration: "underline" }}
          >
            Pind 웹
          </a>
          에서 로그인 후 사용하세요.
        </p>
      )}
    </div>
  )
}

export default IndexPopup
