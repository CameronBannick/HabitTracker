import type { ReactNode } from 'react'

const SL_BLUE = '#1E7FFF'

/** The bracketed System panel LevelUp's cards use: blue shell, corner accents, dark body. */
export function SystemCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative" style={{ boxShadow: '0 0 6px rgba(30,127,255,0.18)' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(30, 127, 255, 0.18)' }} />
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: SL_BLUE }} />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: SL_BLUE }} />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: SL_BLUE }} />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: SL_BLUE }} />
      <div className="relative m-[1px] px-3 py-2" style={{ background: 'rgba(3, 10, 24, 0.96)' }}>
        {children}
      </div>
    </div>
  )
}
