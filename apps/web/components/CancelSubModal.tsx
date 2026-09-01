"use client";

import { Crown } from "lucide-react";

interface CancelSubModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelSubModal({ onClose, onConfirm }: CancelSubModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-xs rounded-2xl shadow-2xl border border-border p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Crown className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground">구독을 취소할까요?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            취소하면 즉시 Free 플랜으로 전환됩니다.
            <br />
            영상 분석이 월 3회로 제한되고 Pro 기능이 비활성화돼요.
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            구독 취소
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors text-foreground"
          >
            유지하기
          </button>
        </div>
      </div>
    </div>
  );
}
