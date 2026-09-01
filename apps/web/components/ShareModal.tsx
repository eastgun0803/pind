"use client";

import { useState } from "react";

import { X, Copy, Check } from "lucide-react";

interface ShareModalProps {
  title: string;
  url: string;
  onClose: () => void;
}

export function ShareModal({ title, url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">공유하기</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground line-clamp-2">{title}</p>
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3 border border-border">
            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{url}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg flex-shrink-0 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> 복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> 복사
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            링크를 받은 사람은 로그인 없이 지도를 볼 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}
