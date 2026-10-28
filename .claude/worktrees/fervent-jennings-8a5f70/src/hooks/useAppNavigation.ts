import { useNavigate } from 'react-router-dom'
import { keyToPath } from '@/app/router/paths'

/**
 * Navigation adapter that preserves the prototype's `onNav(key)` / `goBack()`
 * call surface while routing through React Router underneath. Screens keep
 * calling `onNav("wallet")` and `goBack()` exactly as before; they now produce
 * real URL changes, browser history, and working back/forward.
 */
export function useAppNavigation() {
  const navigate = useNavigate()
  const onNav = (key: string) => navigate(keyToPath[key] ?? `/${key}`)
  const goBack = () => navigate(-1)
  return { onNav, goBack }
}
