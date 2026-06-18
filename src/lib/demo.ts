export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const DEMO_LOGIN_HINT: Record<string, string> = {
  'admin@demo.com': 'super_admin',
  'client@demo.com': 'client_admin',
  'staff@demo.com': 'client_staff',
  'consultant@demo.com': 'tide_consultant',
}

export const DEMO_USERS = {
  super_admin: {
    id: 'demo-super-admin',
    email: 'admin@demo.com',
    name: 'Demo Super Admin',
    role: 'super_admin',
    tenant_id: null,
    phone: null,
    created_at: new Date().toISOString(),
  },
  client_admin: {
    id: 'demo-client-admin',
    email: 'client@demo.com',
    name: 'Demo Client Admin',
    role: 'client_admin',
    tenant_id: 'demo-tenant',
    phone: null,
    created_at: new Date().toISOString(),
  },
  client_staff: {
    id: 'demo-client-staff',
    email: 'staff@demo.com',
    name: 'Demo Staff',
    role: 'client_staff',
    tenant_id: 'demo-tenant',
    phone: null,
    created_at: new Date().toISOString(),
  },
  tide_consultant: {
    id: 'demo-consultant',
    email: 'consultant@demo.com',
    name: 'Demo Consultant',
    role: 'tide_consultant',
    tenant_id: null,
    phone: null,
    created_at: new Date().toISOString(),
  },
}
