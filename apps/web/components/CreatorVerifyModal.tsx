"use client";

import { useState } from "react";

import { X, Video, Check, BadgeCheck, LayoutDashboard } from "lucide-react";

interface CreatorVerifyModalProps {
  onClose: () => void;
  onVerified: (channelUrl: string) => void;
}

/**
 * 채널 연결은 부가 정보 표시용 목업 — 실제 소유권 검증 없이 URL만 저장한다.
 * 크리에이터 대시보드 접근 여부는 "분석한 영상이 1개 이상 있는가"로 판단하며 이 모달과 무관하다.
 */
export function CreatorVerifyModal({ onClose, onVerified }: CreatorVerifyModalProps) {
  const [channelUrl, setChannelUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);

  const handleVerify = () => {
    if (!channelUrl.trim()) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setDone(true);
    }, 1200);
  };

  const handleDone = () => {
    onVerified(channelUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm">채널 연결</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {!done ? (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground">유튜브 채널 URL을 연결하면 대시보드에 표시돼요</p>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://youtube.com/@채널명"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={!channelUrl.trim() || verifying}
              className="w-full py-3 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  연결하기
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <BadgeCheck className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">채널 연결 완료!</p>
            </div>
            <button
              onClick={handleDone}
              className="w-full py-3 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> 대시보드 열기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
