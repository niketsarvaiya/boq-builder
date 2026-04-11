import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import type { Theme } from '../../lib/theme'

const OPTIONS: { value: Theme; Icon: typeof Sun; label: string }[] = [
  { value: 'light', Icon: Sun, label: 'Light' },
  { value: 'dark', Icon: Moon, label: 'Dark' },
  { value: 'system', Icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '2px',
      padding: '3px', borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {OPTIONS.map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            border: 'none', cursor: 'pointer',
            background: theme === value ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: theme === value ? '#818cf8' : '#565a72',
            transition: 'all 0.15s',
          }}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  )
}
