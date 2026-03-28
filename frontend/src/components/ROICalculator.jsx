import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.75rem 1rem',
      }}>
        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{label}</p>
        <p style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#38bdf8' }}>
          {payload[0].value} hrs
        </p>
      </div>
    )
  }
  return null
}

export default function ROICalculator({ roi }) {
  const [hourlyRate, setHourlyRate] = useState(800)

  if (!roi) return null

  const savedValue   = Math.round(roi.followup_saved_hrs * hourlyRate)
  const totalBefore  = roi.person_hours + roi.followup_saved_hrs
  const totalAfter   = roi.person_hours

  const chartData = [
    { label: 'Without MeetMind', hours: parseFloat(totalBefore.toFixed(1)), color: '#f87171' },
    { label: 'With MeetMind',    hours: parseFloat(totalAfter.toFixed(1)),  color: '#4ade80' },
  ]

  return (
    <div className="glow-card" style={{ padding: '1.75rem' }}>
      <h3 style={{
        fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem',
        color: '#2dd4bf', marginBottom: '1.5rem',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        💰 ROI Calculator
      </h3>

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Person-hours in meeting', value: `${roi.person_hours} hrs`,          color: '#38bdf8' },
          { label: 'Follow-up time saved',    value: `${roi.followup_saved_hrs} hrs`,    color: '#4ade80' },
          { label: 'Value saved',             value: `₹${savedValue.toLocaleString()}`,  color: '#fbbf24' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1rem', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', color: m.color, marginBottom: '0.3rem' }}>
              {m.value}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Hourly Rate Slider */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <label style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hourly Rate
          </label>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: '#fbbf24' }}>
            ₹{hourlyRate}/hr
          </span>
        </div>
        <input
          type="range"
          min={200}
          max={5000}
          step={100}
          value={hourlyRate}
          onChange={e => setHourlyRate(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#0ea5e9', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>₹200</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>₹5,000</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={60} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'DM Sans' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'DM Sans' }}
              axisLine={false} tickLine={false}
              unit=" hrs"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}