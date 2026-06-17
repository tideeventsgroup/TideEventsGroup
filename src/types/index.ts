export type Role = 'super_admin' | 'client_admin' | 'client_staff' | 'tide_consultant'

export type TenantStatus = 'active' | 'onboarding' | 'suspended' | 'expired'
export type TenantType = 'festival' | 'venue' | 'local_authority' | 'charity' | 'private_event_company'
export type LicenceTier = 'per_event' | 'annual'

export interface Tenant {
  id: string
  name: string
  type: TenantType | null
  licence_tier: LicenceTier | null
  status: TenantStatus
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  registered_address: string | null
  created_at: string
}

export interface User {
  id: string
  tenant_id: string | null
  email: string
  role: Role
  name: string | null
  phone: string | null
  created_at: string
}

export type EventStatus = 'planning' | 'documentation' | 'pre_event_review' | 'live' | 'post_event' | 'closed'
export type EventType = 'outdoor_festival' | 'harbour_event' | 'street_event' | 'indoor_venue' | 'sporting_event' | 'community_event'

export interface Event {
  id: string
  tenant_id: string
  name: string
  type: EventType | null
  venue_name: string | null
  venue_address: string | null
  start_date: string | null
  end_date: string | null
  expected_attendance: number | null
  status: EventStatus
  assigned_consultant_id: string | null
  licensed: boolean
  sag_involvement: boolean
  police_liaison_name: string | null
  police_liaison_contact: string | null
  created_at: string
}

export type ContractorType = 'security' | 'stewarding' | 'medical' | 'fire_safety' | 'infrastructure'

export interface Contractor {
  id: string
  tenant_id: string
  event_id: string | null
  company_name: string
  type: ContractorType | null
  sia_licence_number: string | null
  sia_expiry_date: string | null
  primary_contact_name: string | null
  primary_contact_phone: string | null
  archived: boolean
  created_at: string
}

export type DocumentType = 'ossp' | 'terrorism_risk_plan' | 'fire_management_plan' | 'risk_assessment' | 'sag_submission' | 'briefing' | 'other'
export type DocumentStatus = 'draft' | 'final' | 'submitted'

export interface Document {
  id: string
  tenant_id: string
  event_id: string | null
  type: DocumentType
  title: string
  content_json: Record<string, unknown>
  status: DocumentStatus
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type IncidentCategory =
  | 'medical' | 'security' | 'crowd_pressure' | 'fire_evacuation'
  | 'ct_concern' | 'suspicious_behaviour' | 'lost_person' | 'infrastructure'
  | 'noise_nuisance' | 'near_miss' | 'other' | 'critical_declaration'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'logged' | 'assigned' | 'in_progress' | 'resolved'

export interface Incident {
  id: string
  event_id: string
  tenant_id: string
  category: IncidentCategory
  severity: IncidentSeverity | null
  description: string | null
  location_zone: string | null
  location_lat: number | null
  location_lng: number | null
  photo_url: string | null
  status: IncidentStatus
  logged_by: string | null
  assigned_to: string | null
  reference_number: string | null
  created_at: string
  resolved_at: string | null
}

export interface IncidentAction {
  id: string
  incident_id: string
  action_type: string
  note: string | null
  performed_by: string | null
  created_at: string
}

export interface Risk {
  id: string
  event_id: string
  tenant_id: string
  hazard: string
  who_at_risk: string | null
  existing_controls: string | null
  likelihood: number | null
  severity: number | null
  risk_score: number | null
  additional_controls: string | null
  responsible_person: string | null
  review_date: string | null
  flagged_high: boolean | null
  created_at: string
}

export type ComplianceStatus = 'not_started' | 'in_progress' | 'complete'

export interface MartynCompliance {
  id: string
  tenant_id: string
  event_id: string | null
  item_key: string
  status: ComplianceStatus
  evidence_url: string | null
  notes: string | null
  updated_by: string | null
  updated_at: string
}

export interface AuditLog {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface TrainingCourse {
  id: string
  title: string
  modules_json: unknown[]
  pass_mark: number
  certificate_template: string | null
  created_at: string
}

export interface TrainingCompletion {
  id: string
  user_id: string
  course_id: string
  score: number | null
  passed: boolean | null
  certificate_url: string | null
  completed_at: string
}

export interface OfflineIncident {
  tempId: string
  event_id: string
  tenant_id: string
  category: IncidentCategory
  severity: IncidentSeverity
  description: string
  location_zone: string
  reference_number: string
  created_at: string
}
