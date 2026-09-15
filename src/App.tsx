import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useHabitState } from './hooks/useHabitState'
import { BottomNav } from './components/BottomNav'
import { Habits } from './pages/Habits'
import { Tasks } from './pages/Tasks'
import { Vices } from './pages/Vices'
import { Settings } from './pages/Settings'

function App() {
  // One state hook for the whole app — every page takes the same handle, so the
  // signal emitter and the one-time LevelUp import inside it run exactly once.
  const app = useHabitState()

  return (
    <BrowserRouter>
      <div
        className="max-w-lg mx-auto min-h-dvh"
        style={{
          paddingBottom: 'calc(6rem + var(--sab))',
          paddingLeft: 'var(--sal)',
          paddingRight: 'var(--sar)',
        }}
      >
        <Routes>
          <Route path="/" element={<Habits app={app} />} />
          <Route path="/tasks" element={<Tasks app={app} />} />
          <Route path="/vices" element={<Vices app={app} />} />
          <Route path="/settings" element={<Settings app={app} />} />
        </Routes>
      </div>

      <BottomNav />
    </BrowserRouter>
  )
}

export default App
