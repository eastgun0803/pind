import { create } from "zustand"

interface VideoState {
  latestVideoId: string | null
  setLatestVideoId: (id: string) => void
  clear: () => void
}

export const useVideoStore = create<VideoState>((set) => ({
  latestVideoId: null,
  setLatestVideoId: (id) => set({ latestVideoId: id }),
  clear: () => set({ latestVideoId: null }),
}))
