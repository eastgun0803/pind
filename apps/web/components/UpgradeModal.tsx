"use client";

import { useState } from "react";

import { X, Crown, Check, CreditCard } from "lucide-react";

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

/** 구독 결제는 목업 — 실제 PG 연동 없이 UI 흐름만 보여준다 (MVP 범위 밖). */
export function UpgradeModal({ onClose, onUpgrade }: UpgradeModalProps) {
  const [done, setDone] = useState(false);

  const handlePay = () => {
    setDone(true);
    setTimeout(() => onUpgrade(), 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden">
        {!done ? (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold text-foreground">Pind Pro</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">분석 횟수 제한 없이 더 많은 기능을 사용하세요</p>
              <div className="space-y-2.5">
                {[
                  { icon: "📹", text: "영상 분석 무제한" },
                  { icon: "📊", text: "크리에이터 대시보드 상세 지표" },
                  { icon: "🗺️", text: "컬렉션·경로 추천 고급 기능" },
                  { icon: "⚡", text: "분석 우선 처리" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2.5 text-sm">
                    <span>{f.icon}</span>
                    <span className="text-foreground">{f.text}</span>
                    <Check className="w-3.5 h-3.5 text-green-500 ml-auto flex-shrink-0" />
                  </div>
                ))}
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center border border-border">
                <span className="text-2xl font-bold text-foreground">₩9,900</span>
                <span className="text-sm text-muted-foreground"> / 월</span>
                <p className="text-xs text-muted-foreground mt-1">언제든지 취소 가능</p>
              </div>
              <button
                onClick={handlePay}
                className="w-full py-3 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> 지금 시작하기
              </button>
              <button
                onClick={onClose}
                className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                나중에
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <Crown className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Pro 활성화 완료!</p>
              <p className="text-xs text-muted-foreground mt-1">이제 영상 분석을 무제한으로 쓸 수 있어요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
