import { create } from "zustand";

interface VideoState {
  latestVideoId: string | null;
  latestVideoUrl: string | null;
  setLatestVideo: (id: string, url: string) => void;
  clear: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  latestVideoId: null,
  latestVideoUrl: null,
  setLatestVideo: (id, url) => set({ latestVideoId: id, latestVideoUrl: url }),
  clear: () => set({ latestVideoId: null, latestVideoUrl: null }),
}));
