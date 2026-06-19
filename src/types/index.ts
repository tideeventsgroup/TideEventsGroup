// ============================================================
// TIDE – Tactical Incident & Dispatch Environment
// Core Type Definitions v2.0
// ============================================================

export type Role =
  | 'super_admin' | 'client_admin' | 'client_staff' | 'tide_consultant'
  | 'gold_command' | 'silver_command' | 'event_manager' | 'operations_manager'
  | 'incident_manager' | 'security_manager' | 'medical_lead' | 'police_liaison'
  | 'comms_officer' | 'cad_operator' | 'situational_awareness' | 'event_staff'

export type AppMode = 'planning' | 'live'

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  client_admin: 'Client Admin',
  client_staff: 'Client Staff',
  tide_consultant: 'Tide Consultant',
  gold_command: 'Gold Command',
  silver_command: 'Silver Command',
  event_manager: 'Event Manager',
  operations_manager: 'Operations Manager',
  incident_manager: 'Incident Manager',
  security_manager: 'Security Manager',
  medical_lead: 'Medical Lead',
  police_liaison: 'Police Liaison',
  comms_officer: 'Communications Officer',
  cad_operator: 'CAD Operator',
  situational_awareness: 'Situational Awareness',
  event_staff: 'Event Staff',
}

// Which modes each role can access
export const ROLE_MODES: Record<Role, AppMode[]> = {
  super_admin: ['planning', 'live'],
  client_admin: ['planning', 'live'],
  tide_consultant: ['planning', 'live'],
  client_staff: ['live'],
  gold_command: ['live'],
  silver_command: ['planning', 'live'],
  event_manager: ['planning', 'live'],
  operations_manager: ['planning', 'live'],
  incident_manager: ['live'],
  security_manager: ['live'],
  medical_lead: ['live'],
  police_liaison: ['live'],
  comms_officer: ['live'],
  cad_operator: ['live'],
  situational_awareness: ['live'],
  event_staff: ['live'],
}

// ── Tenant ───────────────────────────────────────────────────
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

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string
  tenant_id: string | null
  email: string
  role: Role
  name: string | null
  phone: string | null
  call_sign: string | null
  avatar_url: string | null
  created_at: string
}

// ── Event ────────────────────────────────────────────────────
export type EventStatus = 'planning' | 'documentation' | 'pre_event_review' | 'live' | 'post_event' | 'closed'
export type EventMode = 'planning' | 'live' | 'post_event'
export type EventType = 'outdoor_festival' | 'harbour_event' | 'street_event' | 'indoor_venue' | 'sporting_event' | 'community_event' | 'stadium' | 'motorsport' | 'council' | 'concert'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface TideEvent {
  id: string
  tenant_id: string
  name: string
  type: EventType | null
  venue_name: string | null
  venue_address: string | null
  location_lat: number | null
  location_lng: number | null
  start_date: string | null
  end_date: string | null
  operational_hours_start: string | null
  operational_hours_end: string | null
  expected_attendance: number | null
  capacity: number | null
  risk_level: RiskLevel
  status: EventStatus
  current_mode: EventMode
  attendance_current: number
  weather_notes: string | null
  assigned_consultant_id: string | null
  licensed: boolean
  sag_involvement: boolean
  police_liaison_name: string | null
  police_liaison_contact: string | null
  created_at: string
}

// Legacy alias for backward compat with older pages
export type Event = TideEvent

// ── CAD Incident ─────────────────────────────────────────────
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
export type IncidentStatus = 'new' | 'assigned' | 'en_route' | 'on_scene' | 'resolved' | 'closed'
  | 'logged' | 'in_progress'
export type IncidentCategory =
  | 'security' | 'medical' | 'safety' | 'welfare' | 'infrastructure' | 'environmental' | 'other'
  | 'crowd_pressure' | 'fire_evacuation' | 'ct_concern' | 'suspicious_behaviour'
  | 'lost_person' | 'noise_nuisance' | 'near_miss'

export type IncidentType =
  // Security
  | 'assault' | 'theft' | 'disorder' | 'ejection' | 'suspicious_package' | 'fight'
  // Medical
  | 'first_aid' | 'cardiac' | 'trauma' | 'ambulance_required' | 'overdose' | 'mental_health'
  // Safety
  | 'fire' | 'structural' | 'hazard' | 'crowd_crush'
  // Welfare
  | 'lost_child' | 'missing_person' | 'welfare_concern' | 'intoxication'
  // Infrastructure
  | 'power_failure' | 'water_failure' | 'equipment_failure' | 'comms_failure'
  // Environmental
  | 'weather' | 'flooding' | 'environmental_hazard'
  // Other
  | 'ct_concern' | 'suspicious_behaviour' | 'near_miss' | 'major_incident_declaration' | 'other'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Incident {
  id: string
  event_id: string
  tenant_id: string
  cad_number: string | null
  priority: IncidentPriority
  category: IncidentCategory
  incident_type: IncidentType | null
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
  resolution_notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  closed_at: string | null
  // Joined fields
  logged_by_name?: string | null
  assigned_to_name?: string | null
  event_name?: string | null
  tenant_name?: string | null
}

export interface IncidentAction {
  id: string
  incident_id: string
  action_type: string
  note: string | null
  performed_by: string | null
  performed_by_name: string | null
  created_at: string
}

// ── Resource ─────────────────────────────────────────────────
export type ResourceType = 'personnel' | 'vehicle' | 'medical_team' | 'security_team' | 'steward_team' | 'event_staff' | 'contractor' | 'equipment'
export type ResourceStatus = 'available' | 'assigned' | 'en_route' | 'on_scene' | 'unavailable' | 'off_duty'

export interface Resource {
  id: string
  event_id: string
  tenant_id: string
  name: string
  type: ResourceType
  call_sign: string | null
  phone: string | null
  location_zone: string | null
  location_lat: number | null
  location_lng: number | null
  status: ResourceStatus
  assigned_incident_id: string | null
  assigned_cad_number?: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── Communications ───────────────────────────────────────────
export type CommsType = 'radio' | 'phone' | 'email' | 'broadcast' | 'log'
export type CommsDirection = 'inbound' | 'outbound' | 'internal'

export interface CommsLog {
  id: string
  event_id: string
  tenant_id: string
  type: CommsType
  direction: CommsDirection
  from_callsign: string | null
  to_callsign: string | null
  channel: string | null
  message: string | null
  linked_incident_id: string | null
  logged_by: string | null
  logged_by_name: string | null
  created_at: string
}

// ── Major Incident ───────────────────────────────────────────
export interface MajorIncident {
  id: string
  event_id: string
  tenant_id: string
  declared_by: string | null
  declared_by_name: string | null
  declared_at: string
  status: 'active' | 'stood_down'
  stood_down_at: string | null
  description: string | null
  strategic_log: StrategicLogEntry[]
  created_at: string
}

export interface StrategicLogEntry {
  timestamp: string
  author: string
  entry: string
}

// ── Broadcast ────────────────────────────────────────────────
export interface Broadcast {
  id: string
  event_id: string
  message: string
  priority: 'normal' | 'urgent' | 'critical'
  sent_by: string | null
  sent_by_name: string | null
  target_roles: Role[]
  created_at: string
}

// ── Site Zone ────────────────────────────────────────────────
export type ZoneType = 'entrance' | 'exit' | 'emergency_gate' | 'medical' | 'security' | 'welfare' | 'command' | 'rvp' | 'stage' | 'hospitality' | 'parking' | 'restricted'

export interface SiteZone {
  id: string
  event_id: string
  name: string
  type: ZoneType | null
  coordinates: unknown | null
  color: string
  notes: string | null
  created_at: string
}

// ── Risk Register ────────────────────────────────────────────
export interface Risk {
  id: string
  event_id: string
  tenant_id: string
  hazard: string
  category: string | null
  who_at_risk: string | null
  existing_controls: string | null
  likelihood: number | null
  impact: number | null
  risk_score: number | null
  additional_controls: string | null
  owner: string | null
  review_date: string | null
  flagged_high: boolean | null
  created_at: string
  // legacy fields
  severity?: string
  responsible_person?: string
}

// ── Staff Schedule ───────────────────────────────────────────
export interface StaffSchedule {
  id: string
  event_id: string
  tenant_id: string
  user_id: string | null
  user_name: string | null
  role_override: string | null
  shift_start: string | null
  shift_end: string | null
  location_zone: string | null
  notes: string | null
  created_at: string
}

// ── Contractor ───────────────────────────────────────────────
export type ContractorType = 'security' | 'stewarding' | 'medical' | 'fire_safety' | 'infrastructure' | 'traffic_management' | 'other'

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
  headcount: number
  archived: boolean
  created_at: string
}

// ── Document ─────────────────────────────────────────────────
export type DocumentType = 'emp' | 'ossp' | 'terrorism_risk_plan' | 'fire_management_plan' | 'risk_assessment' | 'sag_submission' | 'briefing' | 'rams' | 'licence' | 'insurance' | 'site_plan' | 'emergency_procedures' | 'other'
export type DocumentStatus = 'draft' | 'final' | 'submitted' | 'approved'

export interface Document {
  id: string
  tenant_id: string
  event_id: string | null
  type: DocumentType
  title: string
  content_json: Record<string, unknown>
  file_url: string | null
  status: DocumentStatus
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Compliance ───────────────────────────────────────────────
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

// ── Audit Log ────────────────────────────────────────────────
export interface AuditLog {
  id: string
  tenant_id: string | null
  user_id: string | null
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  metadata: Record<string, unknown>
  created_at: string
}

// ── Training ─────────────────────────────────────────────────
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

// ── Stats ────────────────────────────────────────────────────
export interface EventStats {
  totalIncidents: number
  openIncidents: number
  criticalIncidents: number
  resolvedIncidents: number
  availableResources: number
  totalResources: number
  activeResources: number
  pendingActions: number
  avgResolutionMin: number
  byPriority: Record<string, number>
  bySeverity: Record<string, number>
  byStatus: Record<string, number>
  byCategory: { category: string; count: number }[]
  trend7d: { day: string; count: number }[]
}

// ── Offline support ──────────────────────────────────────────
export interface OfflineIncident {
  tempId: string
  event_id: string
  tenant_id: string
  category: IncidentCategory
  incident_type: IncidentType
  severity: IncidentSeverity
  description: string
  location_zone: string
  reference_number: string
  created_at: string
}

// ── Priority colours ─────────────────────────────────────────
export const PRIORITY_COLORS: Record<IncidentPriority, { bg: string; text: string; border: string }> = {
  P1: { bg: '#FF3B30', text: '#fff', border: '#FF3B30' },
  P2: { bg: '#FF9500', text: '#fff', border: '#FF9500' },
  P3: { bg: '#FFCC00', text: '#000', border: '#FFCC00' },
  P4: { bg: '#34C759', text: '#fff', border: '#34C759' },
  P5: { bg: '#636366', text: '#fff', border: '#636366' },
}

export const PRIORITY_LABELS: Record<IncidentPriority, string> = {
  P1: 'P1 · Critical',
  P2: 'P2 · High',
  P3: 'P3 · Medium',
  P4: 'P4 · Low',
  P5: 'P5 · Info',
}

export const STATUS_COLORS: Record<IncidentStatus, { bg: string; text: string }> = {
  new:         { bg: 'rgba(255,59,48,0.15)',   text: '#FF3B30' },
  assigned:    { bg: 'rgba(255,149,0,0.15)',   text: '#FF9500' },
  en_route:    { bg: 'rgba(255,204,0,0.15)',   text: '#FFCC00' },
  on_scene:    { bg: 'rgba(90,200,250,0.15)',  text: '#5AC8FA' },
  resolved:    { bg: 'rgba(52,199,89,0.15)',   text: '#34C759' },
  closed:      { bg: 'rgba(99,99,102,0.15)',   text: '#636366' },
  logged:      { bg: 'rgba(255,59,48,0.15)',   text: '#FF3B30' },
  in_progress: { bg: 'rgba(255,149,0,0.15)',   text: '#FF9500' },
}

export const INCIDENT_TYPES_BY_CATEGORY: Record<IncidentCategory, { value: IncidentType; label: string }[]> = {
  security: [
    { value: 'assault', label: 'Assault' },
    { value: 'theft', label: 'Theft' },
    { value: 'disorder', label: 'Disorder' },
    { value: 'ejection', label: 'Ejection' },
    { value: 'suspicious_package', label: 'Suspicious Package' },
    { value: 'fight', label: 'Fight / Affray' },
    { value: 'ct_concern', label: 'Counter-Terrorism Concern' },
    { value: 'suspicious_behaviour', label: 'Suspicious Behaviour' },
  ],
  medical: [
    { value: 'first_aid', label: 'First Aid' },
    { value: 'cardiac', label: 'Cardiac / Chest Pain' },
    { value: 'trauma', label: 'Trauma / Injury' },
    { value: 'ambulance_required', label: 'Ambulance Required' },
    { value: 'overdose', label: 'Overdose / Substance' },
    { value: 'mental_health', label: 'Mental Health' },
  ],
  safety: [
    { value: 'fire', label: 'Fire' },
    { value: 'structural', label: 'Structural Concern' },
    { value: 'hazard', label: 'Hazard' },
    { value: 'crowd_crush', label: 'Crowd Crush / Surge' },
  ],
  welfare: [
    { value: 'lost_child', label: 'Lost Child' },
    { value: 'missing_person', label: 'Missing Person' },
    { value: 'welfare_concern', label: 'Welfare Concern' },
    { value: 'intoxication', label: 'Intoxication' },
  ],
  infrastructure: [
    { value: 'power_failure', label: 'Power Failure' },
    { value: 'water_failure', label: 'Water / Facilities Failure' },
    { value: 'equipment_failure', label: 'Equipment Failure' },
    { value: 'comms_failure', label: 'Communications Failure' },
  ],
  environmental: [
    { value: 'weather', label: 'Severe Weather' },
    { value: 'flooding', label: 'Flooding' },
    { value: 'environmental_hazard', label: 'Environmental Hazard' },
  ],
  other: [
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'major_incident_declaration', label: 'Major Incident Declaration' },
    { value: 'other', label: 'Other' },
  ],
  // legacy categories mapped to nearest equivalents
  crowd_pressure:       [{ value: 'crowd_crush', label: 'Crowd Pressure' }],
  fire_evacuation:      [{ value: 'fire', label: 'Fire / Evacuation' }],
  ct_concern:           [{ value: 'ct_concern', label: 'CT Concern' }],
  suspicious_behaviour: [{ value: 'suspicious_behaviour', label: 'Suspicious Behaviour' }],
  lost_person:          [{ value: 'missing_person', label: 'Lost Person' }],
  noise_nuisance:       [{ value: 'other', label: 'Noise Nuisance' }],
  near_miss:            [{ value: 'near_miss', label: 'Near Miss' }],
}
