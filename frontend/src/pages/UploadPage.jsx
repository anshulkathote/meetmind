import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeMeeting } from '../api/client'
import { useMeeting } from '../context/MeetingContext'

const AGENTS = [
  { name: 'Parser Agent',       desc: 'Extracting tasks and action items...' },
  { name: 'Sentiment Agent',    desc: 'Analysing emotional tone and blockers...' },
  { name: 'Dependency Agent',   desc: 'Mapping task dependencies...' },
  { name: 'SLA Monitor',        desc: 'Checking deadlines and risk scores...' },
  { name: 'Escalation Agent',   desc: 'Generating alerts...' },
  { name: 'Summary Agent',      desc: 'Writing meeting summary...' },
  { name: 'ROI Agent',          desc: 'Calculating time and value saved...' },
  { name: 'Audit Agent',        desc: 'Logging pipeline to audit trail...' },
]

const DEMO = `Meeting: Q3 Product Planning
Attendees: Alice, Bob, Carol, David
Duration: 45 minutes

Alice: Okay let's get started. Bob, can you own the API rate limiting fix? We've been getting complaints and this is critical.
Bob: Sure, I'll have it done by Friday.
Alice: Great. Carol, we need the new onboarding flow designs. Can you get those to us by end of next week?
Carol: Honestly I'm a bit confused about the scope here. Are we redesigning the whole flow or just the first screen?
Alice: Just the first three screens for now.
Carol: Okay that's more manageable. I can do that by next Wednesday.
David: I'm worried about the API fix though. The rate limiting depends on the auth service refactor I'm still working on. Bob can't really start until I finish that.
Bob: Yeah that's true. David when do you think you'll be done?
David: I keep getting blocked on this. Probably end of next week if nothing else comes up.
Alice: That's too late honestly. We need the API fix before the investor demo on the 15th. David can you prioritize this?
David: I'll try but I'm already stretched thin. I have three other things on my plate.
Alice: Okay let's flag this as a risk. Carol, once the designs are done Bob will need them to update the UI components.
Bob: Right, the UI work depends on Carol's designs.
Alice: David please send a written update by tomorrow on your auth timeline. And can someone document the new API schema?
Bob: I can do that after the rate limiting fix.
Alice: Decisions made today: we're going with a phased onboarding redesign, and the investor demo is locked for the 15th. Everyone okay with that?
All: Yes.
Alice: Okay let's reconvene Thursday to check on David's progress.`

export default function UploadPage() {
  const navigate = useNavigate()
  const { setAnalysisResult } = useMeeting()

  const [transcript, setTranscript] = useState('')
  const [title,      setTitle]      = useState('')
  const [attendees,  setAttendees]  = useState('')
  const [duration,   setDuration]   = useState(45)
  const [loading,    setLoading]    = useState(false)
  const [agentStep,  setAgentStep]  = useState(-1)
  const [error,      setError]      = useState(null)

  async function handleAnalyze() {
    if (!transcript.trim()) { setError('Please paste a meeting transcript.'); return }
    if (!title.trim())      { setError('Please enter a meeting title.'); return }
    if (!attendees.trim())  { setError('Please enter at least one attendee.'); return }

    setError(null)
    setLoading(true)
    setAgentStep(0)

    // ── Fix: clear old analysis immediately so stale data never shows ──
    setAnalysisResult(null)

    // Fake agent progress stepper
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < AGENTS.length) setAgentStep(step)
      else clearInterval(interval)
    }, 600)

    try {
      const payload = {
        transcript,
        attendees            : attendees.split(',').map(a => a.trim()).filter(Boolean),
        meeting_duration_mins: Number(duration),
        meeting_title        : title,
      }
      const res = await analyzeMeeting(payload)
      clearInterval(interval)
      setAgentStep(AGENTS.length)
      setAnalysisResult(res.data)   // fully replaces — no merge with old data
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      clearInterval(interval)
      setLoading(false)
      setAgentStep(-1)
      const msg = err?.response?.data?.detail || err.message || 'Unknown error'
      setError(`Analysis failed: ${msg}. Make sure the backend server is running.`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '1rem' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '2.4rem', color: 'var(--text-primary)',
            letterSpacing: '-1px', marginBottom: '0.5rem',
          }}>
            Analyze Your <span style={{ color: 'var(--accent)' }}>Meeting</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem' }}>
            Paste your transcript and let 8 AI agents extract insights automatically
          </p>
        </div>

        <div className="glow-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Meeting Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q3 Product Planning"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>
                Attendees <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma separated)</span>
              </label>
              <input
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                placeholder="Alice, Bob, Carol, David"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (mins)</label>
              <input
                type="number" value={duration} min={1}
                onChange={e => setDuration(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={labelStyle}>Meeting Transcript</label>
              <button
                onClick={() => {
                  setTranscript(DEMO)
                  setTitle('Q3 Product Planning')
                  setAttendees('Alice, Bob, Carol, David')
                  setDuration(45)
                }}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--accent)', padding: '0.25rem 0.75rem',
                  borderRadius: '6px', fontSize: '0.78rem',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Load Demo
              </button>
            </div>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste your full meeting transcript here..."
              rows={14}
              style={{
                ...inputStyle, resize: 'vertical',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.82rem', lineHeight: '1.6',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px',
              marginBottom: '1.25rem', fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem',
              background : loading ? 'var(--bg-card)' : 'var(--accent)',
              color      : loading ? 'var(--text-muted)' : '#fff',
              border: 'none', borderRadius: '10px',
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Meeting'}
          </button>
        </div>

        {loading && (
          <div className="glow-card" style={{ padding: '1.5rem' }}>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.9rem', color: 'var(--accent)',
              marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              Running AI Pipeline
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {AGENTS.map((agent, i) => {
                const done    = i < agentStep
                const active  = i === agentStep
                const pending = i > agentStep
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.75rem', borderRadius: '8px',
                    background: active ? 'rgba(14,165,233,0.08)' : 'transparent',
                    border: active ? '1px solid rgba(14,165,233,0.2)' : '1px solid transparent',
                    transition: 'all 0.3s', opacity: pending ? 0.35 : 1,
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: done ? 'rgba(34,197,94,0.2)' : active ? 'rgba(14,165,233,0.2)' : 'var(--bg-card)',
                      border: done ? '1px solid #4ade80' : active ? '1px solid var(--accent)' : '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', flexShrink: 0,
                    }}>
                      {done ? '✓' : active ? '●' : '○'}
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                        fontSize: '0.875rem',
                        color: done ? '#4ade80' : active ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                        {agent.name}
                      </div>
                      {active && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {agent.desc}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontFamily: 'DM Sans, sans-serif',
  fontWeight: 600, fontSize: '0.85rem',
  color: 'var(--text-muted)', marginBottom: '0.5rem',
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

const inputStyle = {
  width: '100%', background: 'var(--bg-secondary)',
  border: '1px solid var(--border)', borderRadius: '8px',
  padding: '0.7rem 0.9rem', color: 'var(--text-primary)',
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
  outline: 'none', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}