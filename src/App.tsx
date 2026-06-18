import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PageLoader } from './components/ui/LoadingSpinner'

// Layouts
import { AdminLayout } from './components/layout/AdminLayout'
import { ClientLayout } from './components/layout/ClientLayout'
import { AppLayout } from './components/layout/AppLayout'

// Auth
import { Login } from './pages/auth/Login'
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

// App / PWA
import { SelectEvent } from './pages/app/SelectEvent'
import { AppHome } from './pages/app/Home'
import { LogIncident } from './pages/app/LogIncident'
import { MyBriefing } from './pages/app/MyBriefing'
import { SiteMap } from './pages/app/SiteMap'
import { EmergencyContacts } from './pages/app/EmergencyContacts'
import { ViewIncidents } from './pages/app/ViewIncidents'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'super_admin': return <Navigate to="/admin" replace />
    case 'client_admin': return <Navigate to="/client" replace />
    case 'tide_consultant': return <Navigate to="/client" replace />
    case 'client_staff': return <Navigate to="/app/select-event" replace />
    default: return <Navigate to="/login" replace />
  }
}

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function AuthRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <RootRedirect />
  return <Login />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRedirect />} />
            <Route path="/auth/callback" element={<MicrosoftCallback />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Super admin */}
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

            {/* Client portal */}
            <Route path="/client" element={
              <RequireAuth allowedRoles={['client_admin', 'tide_consultant', 'super_admin']}>
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

            {/* Mobile PWA */}
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
