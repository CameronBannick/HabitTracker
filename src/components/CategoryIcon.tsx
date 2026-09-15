import type { ComponentType } from 'react'
import { Brain, ClipboardList, DollarSign, Heart, ListChecks, Shirt, Sparkles } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

// Names match roster.ts CATEGORIES (and LevelUp's category icons).
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Brain,
  ClipboardList,
  DollarSign,
  Heart,
  Shirt,
  Sparkles,
}

interface CategoryIconProps extends Omit<LucideProps, 'name' | 'color' | 'size'> {
  name: string
  color: string
  size?: number
}

export function CategoryIcon({ name, color, size = 20, ...props }: CategoryIconProps) {
  const Icon = ICON_MAP[name] ?? ListChecks
  return <Icon size={size} color={color} {...props} />
}
