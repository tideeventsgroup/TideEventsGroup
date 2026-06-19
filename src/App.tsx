import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PageLoader } from './components/ui/LoadingSpinner'
import { ROLE_MODES } from './types'

// Layouts
import { AdminLayout } from './components/layout/AdminLayout'
import { ClientLayout } from './components/layout/ClientLayout'
import { AppLayout } from './components/layout/AppLayout'
import { LiveLayout } from './components/layout/LiveLayout'
import { PlanningLayout } from './components/layout/PlanningLayout'

// Auth
import { Login } from './pages/auth/Login'
import { ModeSelect } from './pages/auth/ModeSelect'
import { MicrosoftCallback } from './pages/auth/MicrosoftCallback'

// Admin
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminTenants } from './pages/admin/Tenants'
import { TenantDetail } from './pages/admin/TenantDetail'
import { AdminUsers } from './pages/admin/Users'
import { AdminAuditLog } from './pages/admin/AuditLog'
import { ConsultantAssignments } from './pages/admin/ConsultantAssignments'
import { AdminIncidents } from './pages/admin/Incidents'
import { IncidentDetail } from './pages/admin/IncidentDetail'
import { Reports } from './pages/admin/Reports'

// Client
import { ClientDashboard } from './pages/client/Dashboard'
import { Onboarding } from './pages/client/Onboarding'
import { DocumentVault } from './pages/client/DocumentVault'
import { StaffManagement } from './pages/client/StaffManagement'
import { Compliance } from './pages/client/Compliance'
import { Events } from './pages/client/Events'
import { LiveEventDashboard } from './pages/client/LiveEventDashboard'
import { RiskAssessment } from './pages/client/RiskAssessment'
import { Training } from './pages/client/Training'
import { EventDetail } from './pages/client/EventDetail'
import { PostEventReport } from './pages/client/PostEventReport'

// Mobile PWA
import { SelectEvent } from './pages/app/SelectEvent'
import { AppHome } from './pages/app/Home'
import { LogIncident } from './pages/app/LogIncident'
import { MyBriefing } from './pages/app/MyBriefing'
import { SiteMap } from './pages/app/SiteMap'
import { EmergencyContacts } from './pages/app/EmergencyContacts'
import { ViewIncidents } from './pages/app/ViewIncidents'

// Live / CAD
import { LiveDashboard } from './pages/live/Dashboard'
import { LiveIncidents } from './pages/live/Incidents'
import { NewIncident } from './pages/live/NewIncident'
import { LiveIncidentDetail } from './pages/live/IncidentDetail'
import { LiveResources } from './pages/live/Resources'
import { LiveComms } from './pages/live/Comms'
import { MajorIncidentPage } from './pages/live/MajorIncident'
import { LiveReports } from './pages/live/Reports'

// Planning
import { PlanningDashboard } from './pages/planning/Dashboard'
import { PlanningEvents } from './pages/planning/Events'
import { PlanningEventDetail } from './pages/planning/EventDetail'
import { PlanningRiskRegister } from './pages/planning/RiskRegister'
import { PlanningResourcePlan } from './pages/planning/ResourcePlan'
import { PlanningSchedule } from './pages/planning/Schedule'
import { PlanningDocuments } from './pages/planning/Documents'
import { PlanningSiteMap } from './pages/planning/SiteMap'
import { PlanningReports } from './pages/planning/Reports'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  // Legacy admin/client roles go directly to their area
  if (user.role === 'super_admin') return <Navigate to="/admin" replace />
  if (user.role === 'client_admin' || user.role === 'tide_consultant') return <Navigate to="/mode-select" replace />
  if (user.role === 'client_staff') return <Navigate to="/app/select-event" replace />
  // All TIDE operational roles go to mode select
  return <Navigate to="/mode-select" replace />
}

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/mode-select" replace />
  return <>{children}</>
}

function RequireMode({ children, mode }: { children: React.ReactNode; mode: 'planning' | 'live' }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  const allowed = ROLE_MODES[user.role] ?? ['live']
  if (!allowed.includes(mode)) return <Navigate to="/mode-select" replace />
  return <>{children}</>
}

function AuthRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <RootRedirect />
  return <Login />
}

// Operational roles that can access Live and Planning
const OPERATIONAL_ROLES = [
  'super_admin','client_admin','tide_consultant',
  'gold_command','silver_command','event_manager','operations_manager',
  'incident_manager','security_manager','medical_lead','police_liaison',
  'comms_officer','cad_operator','situational_awareness','event_staff',
]

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRedirect />} />
            <Route path="/auth/callback" element={<MicrosoftCallback />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Mode select */}
            <Route path="/mode-select" element={
              <RequireAuth><ModeSelect /></RequireAuth>
            } />

            {/* ── Super admin ── */}
            <Route path="/admin" element={
              <RequireAuth allowedRoles={['super_admin']}>
                <AdminLayout />
              </RequireAuth>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="clients" element={<AdminTenants />} />
              <Route path="clients/:id" element={<TenantDetail />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit" element={<AdminAuditLog />} />
              <Route path="consultants" element={<ConsultantAssignments />} />
              <Route path="incidents" element={<AdminIncidents />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* ── Client portal (legacy) ── */}
            <Route path="/client" element={
              <RequireAuth allowedRoles={['client_admin','tide_consultant','super_admin']}>
                <ClientLayout />
              </RequireAuth>
            }>
              <Route index element={<ClientDashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="events/:id/report" element={<PostEventReport />} />
              <Route path="documents" element={<DocumentVault />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="risks" element={<RiskAssessment />} />
              <Route path="training" element={<Training />} />
              <Route path="live" element={<LiveEventDashboard />} />
            </Route>

            {/* ── LIVE MODE — CAD ── */}
            <Route path="/live" element={
              <RequireMode mode="live">
                <LiveLayout />
              </RequireMode>
            }>
              <Route index element={<LiveDashboard />} />
              <Route path="incidents" element={<LiveIncidents />} />
              <Route path="incidents/new" element={<NewIncident />} />
              <Route path="incidents/:id" element={<LiveIncidentDetail />} />
              <Route path="resources" element={<LiveResources />} />
              <Route path="comms" element={<LiveComms />} />
              <Route path="reports" element={<LiveReports />} />
              <Route path="major-incident" element={<MajorIncidentPage />} />
            </Route>

            {/* ── PLANNING MODE ── */}
            <Route path="/planning" element={
              <RequireMode mode="planning">
                <PlanningLayout />
              </RequireMode>
            }>
              <Route index element={<PlanningDashboard />} />
              <Route path="events" element={<PlanningEvents />} />
              <Route path="events/:id" element={<PlanningEventDetail />} />
              <Route path="risks" element={<PlanningRiskRegister />} />
              <Route path="resources" element={<PlanningResourcePlan />} />
              <Route path="schedule" element={<PlanningSchedule />} />
              <Route path="documents" element={<PlanningDocuments />} />
              <Route path="site-map" element={<PlanningSiteMap />} />
              <Route path="reports" element={<PlanningReports />} />
            </Route>

            {/* ── Mobile PWA ── */}
            <Route path="/app" element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }>
              <Route path="select-event" element={<SelectEvent />} />
              <Route index element={<AppHome />} />
              <Route path="log-incident" element={<LogIncident />} />
              <Route path="briefing" element={<MyBriefing />} />
              <Route path="site-map" element={<SiteMap />} />
              <Route path="emergency" element={<EmergencyContacts />} />
              <Route path="incidents" element={<ViewIncidents />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
