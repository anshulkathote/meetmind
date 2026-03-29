import { useMeeting } from '../context/MeetingContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { getSummary, getTasks } from '../api/client'
import { useEffect, useState } from 'react'
import SummaryCard from '../components/SummaryCard'
import ROICalculator from '../components/ROICalculator'

export default function SummaryPage() {
  const { analysisResult } = useMeeting()
  const { workspace } = useWorkspace()
  const [summary,  setSummary]  = useState(null)
  const [roi,      setRoi]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    async function load() {
      // Use fresh in-memory data if available (admin just analyzed)
      if (analysisResult?.summary) {
        setSummary(analysisResult.summary)
        setRoi(analysisResult.roi || null)
        setLoading(false)
        return
      }
      // Fetch from API for members / returning admins
      try {
        const workspaceId = workspace?.id || 1
        const [sumRes, taskRes] = await Promise.all([
          getSummary(workspaceId),
          getTasks(workspaceId),
        ])
        setSummary(sumRes.data)
        // Reconstruct a minimal ROI from task count if no roi stored
        const tasks = taskRes.data || []
        setRoi({
          person_hours: null,
          manual_followup_hrs: null,
          followup_saved_hrs: null,
          value_inr: null,
          _unavailable: true,
          total_tasks: tasks.length,
        })
      } catch (e) {
        if (e?.response?.status === 404) {
          setError('no_data')
        } else {
          setError('fetch_failed')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [analysisResult, workspace])

  return (
    <div className="page">
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

      {loading ? (
        <div className="glow-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
          Loading summary...
        </div>
      ) : error === 'no_data' ? (
        <div className="glow-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No summary yet
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            The admin needs to analyze a meeting first to generate the summary.
          </p>
        </div>
      ) : error === 'fetch_failed' ? (
        <div className="glow-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ fontSize: '0.875rem', color: '#f87171', fontFamily: 'DM Sans' }}>
            Could not load summary. Make sure the backend is running.
          </p>
        </div>
      ) : summary ? (
        <>
          {summary.sentiment_overview && (
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glow-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', color: '#38bdf8' }}>
                  {summary.total_tasks || 0}
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
                  {summary.high_priority_count || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  High Priority
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <SummaryCard title="Decisions Made"      icon="✅" items={summary.decisions_made}      color="#4ade80" />
            <SummaryCard title="Open Action Items"   icon="📌" items={summary.open_action_items}   color="#38bdf8" />
            <SummaryCard title="Key Risks"           icon="⚠️" items={summary.key_risks}           color="#f87171" />
            <SummaryCard title="Next Meeting Agenda" icon="📅" items={summary.next_meeting_agenda} color="#c084fc" />
          </div>

          {roi && !roi._unavailable && <ROICalculator roi={roi} />}
        </>
      ) : null}
    </div>
  )
}
