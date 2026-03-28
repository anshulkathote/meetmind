import { useMeeting } from '../context/MeetingContext'
import SummaryCard from '../components/SummaryCard'
import ROICalculator from '../components/ROICalculator'

export default function SummaryPage() {
  const { analysisResult } = useMeeting()
  const summary = analysisResult?.summary
  const roi     = analysisResult?.roi

  return (
    <div className="page">

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: '1.8rem',
          color: 'var(--text-primary)', letterSpacing: '-0.5px',
        }}>
          Meeting <span style={{ color: 'var(--accent)' }}>Summary</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          AI-generated insights, decisions, and ROI from your meeting
        </p>
      </div>

      {!analysisResult ? (
        <div className="glow-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No summary yet
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            Analyze a meeting first to generate the summary
          </p>
        </div>
      ) : (
        <>
          {/* Sentiment Overview */}
          {summary?.sentiment_overview && (
            <div style={{
              background: 'rgba(14,165,233,0.08)',
              border: '1px solid rgba(14,165,233,0.2)',
              borderRadius: '10px', padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              fontFamily: 'DM Sans', fontSize: '0.9rem',
              color: 'var(--text-primary)', lineHeight: 1.6,
            }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: '0.5rem' }}>🧠 Sentiment Overview</span>
              {summary.sentiment_overview}
            </div>
          )}

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glow-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', color: '#38bdf8' }}>
                  {summary?.total_tasks || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Tasks
                </p>
              </div>
            </div>
            <div className="glow-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🔴</span>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', color: '#f87171' }}>
                  {summary?.high_priority_count || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  High Priority
                </p>
              </div>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <SummaryCard
              title="Decisions Made"
              icon="✅"
              items={summary?.decisions_made}
              color="#4ade80"
            />
            <SummaryCard
              title="Open Action Items"
              icon="📌"
              items={summary?.open_action_items}
              color="#38bdf8"
            />
            <SummaryCard
              title="Key Risks"
              icon="⚠️"
              items={summary?.key_risks}
              color="#f87171"
            />
            <SummaryCard
              title="Next Meeting Agenda"
              icon="📅"
              items={summary?.next_meeting_agenda}
              color="#c084fc"
            />
          </div>

          {/* ROI Calculator */}
          {roi && <ROICalculator roi={roi} />}
        </>
      )}
    </div>
  )
}