import type { ComponentType } from 'react'
import {
  CheckCircle, AlertTriangle, Sparkles, Clock, FileCheck, Star,
  IndianRupee, Users, Car, Scale, HeartPulse, GraduationCap,
  Shield, Flame, Phone, Bell, FileText, Timer, Landmark, Wheat,
  Home, MapPin, ScrollText, Map, Receipt, Building2, Droplet,
} from 'lucide-react'

/**
 * Maps a backend icon *name* (string) to a Lucide component. The API stores
 * icons as strings (JSON-friendly); the view layer resolves them here. Unknown
 * names fall back to a neutral icon so a new backend value never crashes a screen.
 */
type IconComp = ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>

const REGISTRY: Record<string, IconComp> = {
  CheckCircle, AlertTriangle, Sparkles, Clock, FileCheck, Star,
  IndianRupee, Users, Car, Scale, HeartPulse, GraduationCap,
  Shield, Flame, Phone, Bell, FileText, Timer, Landmark, Wheat,
  Home, MapPin, ScrollText, Map, Receipt, Building2, Droplet,
}

export function resolveIcon(name: string | undefined): IconComp {
  return (name && REGISTRY[name]) || FileText
}
