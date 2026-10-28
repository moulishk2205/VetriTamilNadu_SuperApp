import { lazy, Suspense, type ComponentType } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from './guards'
import { RoleRoute } from './RoleRoute'
import { LoadingState } from '@/components/feedback/states'
import NotFound from '@/features/misc/pages/NotFound'

// ── Lazy-loaded route modules (code-split per screen) ───────────────────────
const OnboardingScreen = lazy(() => import('@/features/auth/pages/OnboardingScreen'))
const LoginScreen = lazy(() => import('@/features/auth/pages/LoginScreen'))
const DesktopLogin = lazy(() => import('@/features/auth/pages/DesktopLogin'))
const HomeDashboard = lazy(() => import('@/features/home/pages/HomeDashboard'))
const ServicesHub = lazy(() => import('@/features/services/pages/ServicesHub'))
const DigitalWallet = lazy(() => import('@/features/documents/pages/DigitalWallet'))
const ComplaintModule = lazy(() => import('@/features/complaints/pages/ComplaintModule'))
const AIAssistant = lazy(() => import('@/features/ai/pages/AIAssistant'))
const SchemeDiscovery = lazy(() => import('@/features/schemes/pages/SchemeDiscovery'))
const EmergencyHub = lazy(() => import('@/features/emergency/pages/EmergencyHub'))
const MLADashboard = lazy(() => import('@/features/transparency/pages/MLADashboard'))
const DistrictScorecard = lazy(() => import('@/features/transparency/pages/DistrictScorecard'))
const ServiceTracker = lazy(() => import('@/features/applications/pages/ServiceTracker'))
const NotificationsScreen = lazy(() => import('@/features/notifications/pages/NotificationsScreen'))
const HelpScreen = lazy(() => import('@/features/support/pages/HelpScreen'))
const AccessibilityScreen = lazy(() => import('@/features/settings/pages/AccessibilityScreen'))
const PersonalDetailsScreen = lazy(() => import('@/features/citizen/pages/PersonalDetailsScreen'))
const AddressScreen = lazy(() => import('@/features/citizen/pages/AddressScreen'))
const SecurityScreen = lazy(() => import('@/features/citizen/pages/SecurityScreen'))
const LanguageScreen = lazy(() => import('@/features/settings/pages/LanguageScreen'))
const DarkModeScreen = lazy(() => import('@/features/settings/pages/DarkModeScreen'))
const ProfileScreen = lazy(() => import('@/features/profile/pages/ProfileScreen'))
const ServiceFlow = lazy(() => import('@/features/services/pages/ServiceFlow'))
const DemoMode = lazy(() => import('@/features/demo/pages/DemoMode'))
const OfficerPortal = lazy(() => import('@/features/officer/pages/OfficerPortal'))
const OfficerReview = lazy(() => import('@/features/officer/pages/OfficerReview'))
const DepartmentDashboard = lazy(() => import('@/features/department/pages/DepartmentDashboard'))
const MlaPortal = lazy(() => import('@/features/mla/pages/MlaPortal'))
const AdminPortal = lazy(() => import('@/features/admin/pages/AdminPortal'))
const CitizenTimeline = lazy(() => import('@/features/citizen/pages/CitizenTimeline'))
// Desktop-native presentation of the citizen home. Same data, same routes.
const DesktopDashboard = lazy(() => import('@/features/home/pages/DesktopDashboard'))
const DesktopServices = lazy(() => import('@/features/services/pages/DesktopServices'))
const DesktopApplications = lazy(() => import('@/features/applications/pages/DesktopApplications'))
const DesktopGrievances = lazy(() => import('@/features/complaints/pages/DesktopGrievances'))
const DesktopLocker = lazy(() => import('@/features/documents/pages/DesktopLocker'))
const DesktopSchemes = lazy(() => import('@/features/schemes/pages/DesktopSchemes'))
const DesktopProfile = lazy(() => import('@/features/profile/pages/DesktopProfile'))
const DesktopServiceFlow = lazy(() => import('@/features/services/pages/DesktopServiceFlow'))
const DesktopAI = lazy(() => import('@/features/ai/pages/DesktopAI'))
const DesktopNotifications = lazy(() => import('@/features/notifications/pages/DesktopNotifications'))
const DesktopTimeline = lazy(() => import('@/features/citizen/pages/DesktopTimeline'))
const DesktopHelp = lazy(() => import('@/features/support/pages/DesktopHelp'))
const DesktopEmergency = lazy(() => import('@/features/emergency/pages/DesktopEmergency'))
const DesktopTransparency = lazy(() => import('@/features/transparency/pages/DesktopTransparency'))
const DesktopNotFound = lazy(() => import('@/features/misc/pages/DesktopNotFound'))

// Screens migrated from the prototype consume `onNav` / `goBack` props. This
// host injects them from the navigation adapter so no screen code changes.
type ScreenProps = { onNav: (key: string) => void; goBack: () => void }
function Screen({ Comp }: { Comp: ComponentType<ScreenProps> }) {
  const { onNav, goBack } = useAppNavigation()
  return <Comp onNav={onNav} goBack={goBack} />
}

/**
 * Root entry. The startup animation now plays in `App` (full-screen, before
 * either shell), so `/` simply forwards: returning citizens go straight to
 * their dashboard, new visitors continue to onboarding → login.
 */
function RootRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return <Navigate to={isAuthenticated ? '/home' : '/onboarding'} replace />
}

// Auth screens use an `onDone` callback rather than nav props. These thin
// wrappers preserve the original onboarding → login → home flow.
function OnboardingRoute() {
  const navigate = useNavigate()
  return <OnboardingScreen onDone={() => navigate('/login')} />
}
function LoginRoute({ variant }: { variant: 'mobile' | 'desktop' }) {
  const navigate = useNavigate()
  // Both logins perform the same OTP verification via useAuth; only the
  // presentation differs. The route just forwards once a session exists.
  const Comp = variant === 'desktop' ? DesktopLogin : LoginScreen
  return <Comp onDone={() => navigate('/home')} />
}
// Keyed so switching between services remounts the flow (fresh prefill/state).
function ServiceFlowRoute({ desktop }: { desktop: boolean }) {
  const { id } = useParams()
  return desktop ? <DesktopServiceFlow key={id} /> : <ServiceFlow key={id} />
}

/**
 * One route table for both experiences. The `variant` only swaps the *home*
 * presentation (mobile dashboard vs. desktop portal dashboard) — every other
 * route, guard, API call and piece of business logic is shared.
 */
export function AppRouter({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
  const desktop = variant === 'desktop'
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }}><LoadingState /></div>}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route path="/login" element={<LoginRoute variant={variant} />} />
        <Route path="/demo" element={<DemoMode />} />

        {/* Citizen-only area */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={desktop ? <DesktopDashboard /> : <Screen Comp={HomeDashboard} />} />
          <Route path="/services" element={desktop ? <DesktopServices /> : <Screen Comp={ServicesHub} />} />
          <Route path="/service/:id" element={<ServiceFlowRoute desktop={desktop} />} />
          <Route path="/wallet" element={desktop ? <DesktopLocker /> : <Screen Comp={DigitalWallet} />} />
          <Route path="/complaint" element={desktop ? <DesktopGrievances /> : <Screen Comp={ComplaintModule} />} />
          <Route path="/ai" element={desktop ? <DesktopAI /> : <Screen Comp={AIAssistant} />} />
          <Route path="/schemes" element={desktop ? <DesktopSchemes /> : <Screen Comp={SchemeDiscovery} />} />
          <Route path="/emergency" element={desktop ? <DesktopEmergency /> : <Screen Comp={EmergencyHub} />} />
          <Route path="/mla" element={desktop ? <DesktopTransparency view="mla" /> : <Screen Comp={MLADashboard} />} />
          <Route path="/district" element={desktop ? <DesktopTransparency view="district" /> : <Screen Comp={DistrictScorecard} />} />
          <Route path="/tracker" element={desktop ? <DesktopApplications /> : <Screen Comp={ServiceTracker} />} />
          {/* Each profile route keys its page, so arriving from another profile route
              (a footer or menu link) opens the right tab instead of keeping the last one. */}
          <Route path="/profile" element={desktop ? <DesktopProfile key="profile" /> : <Screen Comp={ProfileScreen} />} />
          <Route path="/notifications" element={desktop ? <DesktopNotifications /> : <Screen Comp={NotificationsScreen} />} />
          <Route path="/help" element={desktop ? <DesktopHelp /> : <Screen Comp={HelpScreen} />} />
          <Route path="/accessibility" element={desktop ? <DesktopProfile key="accessibility" initialTab="preferences" /> : <Screen Comp={AccessibilityScreen} />} />
          <Route path="/personal" element={desktop ? <DesktopProfile key="personal" initialTab="personal" /> : <Screen Comp={PersonalDetailsScreen} />} />
          <Route path="/address" element={desktop ? <DesktopProfile key="address" initialTab="address" /> : <Screen Comp={AddressScreen} />} />
          <Route path="/security" element={desktop ? <DesktopProfile key="security" initialTab="security" /> : <Screen Comp={SecurityScreen} />} />
          <Route path="/language" element={desktop ? <DesktopProfile key="language" initialTab="preferences" /> : <Screen Comp={LanguageScreen} />} />
          <Route path="/darkmode" element={desktop ? <DesktopProfile key="darkmode" initialTab="preferences" /> : <Screen Comp={DarkModeScreen} />} />
          <Route path="/timeline" element={desktop ? <DesktopTimeline /> : <CitizenTimeline />} />
        </Route>

        {/* Officer workspace (RBAC: application processing) */}
        <Route element={<RoleRoute require={['application:process']} />}>
          <Route path="/officer" element={<OfficerPortal />} />
          <Route path="/officer/app/:id" element={<OfficerReview />} />
        </Route>

        {/* Analytics portals (RBAC: analytics access) */}
        <Route element={<RoleRoute require={['analytics:read']} />}>
          <Route path="/department" element={<DepartmentDashboard />} />
          <Route path="/mla-portal" element={<MlaPortal />} />
        </Route>

        {/* Super Admin (RBAC: platform management) */}
        <Route element={<RoleRoute require={['admin:manage']} />}>
          <Route path="/admin" element={<AdminPortal />} />
        </Route>

        <Route path="*" element={desktop ? <DesktopNotFound /> : <NotFound />} />
      </Routes>
    </Suspense>
  )
}
