import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface UiState {
  theme: ThemeMode
  sidebarCollapsed: boolean
  setTheme: (theme: ThemeMode) => void
  toggleSidebar: () => void
  /** true when the reduced-motion media query matches */
  reducedMotion: boolean
  setReducedMotion: (value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      reducedMotion: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    // v2: palette overhaul reset the stored theme to the new dark default
    { name: 'typesense-ui-v2', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) },
  ),
)

/** Applies the resolved theme to <html data-theme="…"> and tracks system changes. */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
}
