import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const DISCLAIMER = 'This document has been prepared by Tide Events Group Ltd acting in an advisory capacity. Tide Events Group Ltd does not hold operational command authority. The event organiser retains full responsibility for the safety of their event.'

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#0D1F3C', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#1D9E75' },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0D1F3C' },
  headerSub: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0D1F3C', marginBottom: 4 },
  docMeta: { fontSize: 9, color: '#6B7280', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0D1F3C', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  body: { fontSize: 10, color: '#374151', lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, textAlign: 'center', fontSize: 8, color: '#9CA3AF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  pageNumber: { position: 'absolute', bottom: 20, right: 48, fontSize: 8, color: '#9CA3AF' },
})

interface OSSPData {
  eventName?: string
  venueAddress?: string
  expectedAttendance?: number
  eventDate?: string
  eventType?: string
  organiserName?: string
  sections?: Record<string, string>
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>{DISCLAIMER}</Text>
    </View>
  )
}

const OSSP_SECTIONS = [
  { key: 'event_overview', title: '1. Event overview' },
  { key: 'venue_description', title: '2. Venue description' },
  { key: 'management_structure', title: '3. Management structure' },
  { key: 'crowd_management', title: '4. Crowd management plan' },
  { key: 'communication_plan', title: '5. Communication plan' },
  { key: 'medical_plan', title: '6. Medical plan' },
  { key: 'fire_safety_plan', title: '7. Fire safety plan' },
  { key: 'major_incident_plan', title: '8. Major incident plan' },
  { key: 'counter_terrorism_plan', title: '9. Counter-terrorism plan' },
  { key: 'traffic_management', title: '10. Traffic management plan' },
  { key: 'appendices', title: 'Appendices' },
]

export function OSSPDocument({ data }: { data: OSSPData }) {
  const sections = data.sections ?? {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.headerTitle}>Tide Events Group</Text>
            <Text style={styles.headerSub}>Event safety consultancy</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: '#6B7280' }}>OSSP</Text>
            <Text style={{ fontSize: 9, color: '#6B7280' }}>OFFICIAL SENSITIVE</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>Operation / Event Safety Statement and Plan</Text>
        <Text style={styles.docMeta}>
          Event: {data.eventName ?? '—'} · Venue: {data.venueAddress ?? '—'} · Date: {data.eventDate ?? '—'} · Expected attendance: {data.expectedAttendance?.toLocaleString() ?? '—'}
        </Text>

        {OSSP_SECTIONS.map(sec => (
          <View key={sec.key} style={styles.section} break={sec.key === 'medical_plan'}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.body}>
              {sections[sec.key] ?? `[Content for ${sec.title.toLowerCase()} to be completed by the event organiser in consultation with Tide Events Group.]`}
            </Text>
          </View>
        ))}

        <Footer />
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
