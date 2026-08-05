import { useQuery } from '@tanstack/react-query'
import { FileCheck, FileText, AlertTriangle, Sparkles, GraduationCap } from 'lucide-react'
import { StatusBar, Header, Card, Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { analyticsApi } from '@/features/analytics/api/analyticsApi'

const KIND_ICON = { certificate: FileCheck, application: FileText, complaint: AlertTriangle, scheme: Sparkles, milestone: GraduationCap } as const
const KIND_COLOR: Record<string, 'ok' | 'info' | 'warn' | 'sec'> = { certificate: 'ok', application: 'info', complaint: 'warn', scheme: 'sec', milestone: 'sec' }

/**
 * Digital Citizen Timeline — Vetri's signature feature. One chronological view
 * of every government interaction in a citizen's life: certificates,
 * applications, complaints and milestones, composed live from the platform.
 */
export default function CitizenTimeline() {
  const c = useC()
  const { goBack } = useAppNavigation()
  const { citizen } = useAuth()
  const { data } = useQuery({ queryKey: ['citizen', 'timeline'], queryFn: analyticsApi.citizenTimeline })

  return (
    <div style={{ minHeight: '100vh', background: c.bgAlt, paddingBottom: 40 }}>
      <StatusBar />
      <div style={{ padding: '8px 20px' }}>
        <Header title="My Digital Timeline" onBack={goBack} />

        <Card style={{ marginBottom: 18, background: `linear-gradient(135deg,${c.pri}06,${c.sec}06)`, border: `1px solid ${c.pri}15` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Seal size={38} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: c.txt }}>{citizen?.fullName ?? 'Citizen'}</p>
              <p style={{ fontSize: 11, color: c.txt2 }}>One life · one digital history · {data?.total ?? '—'} government interactions</p>
            </div>
          </div>
        </Card>

        <div style={{ position: 'relative', paddingLeft: 26 }}>
          <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: c.bdr }} />
          {(data?.items ?? []).map((e, i, arr) => {
            const Icon = KIND_ICON[e.kind]
            const tone = c[KIND_COLOR[e.kind]]
            const showYear = i === 0 || e.year !== arr[i - 1].year
            return (
              <div key={`${e.title}_${i}`} style={{ position: 'relative', paddingBottom: i === arr.length - 1 ? 0 : 14 }}>
                {showYear && (
                  <p style={{ fontSize: 11, fontWeight: 800, color: c.pri, margin: '6px 0 8px', letterSpacing: 1 }}>{e.year}</p>
                )}
                <div style={{ position: 'absolute', left: -22, top: showYear ? 26 : 6, width: 13, height: 13, borderRadius: '50%', background: tone, border: `2.5px solid ${c.bgAlt}`, zIndex: 1 }} />
                <Card style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${tone}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={tone} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{e.title}</p>
                      <p style={{ fontSize: 11, color: c.txt2 }}>{e.subtitle}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        <p style={{ fontSize: 10.5, color: c.txt3, textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
          Every certificate, application and complaint is preserved here —<br />your government history, owned by you.
        </p>
      </div>
    </div>
  )
}
