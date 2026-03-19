import { useState, useEffect } from 'react'
import { C, SEV_COLOR, SEV_LABEL } from '../constants.js'

function Spinner({ size=18 }) {
  return <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,0.2)`, borderTopColor:'white', borderRadius:'50%', animation:'sl-spin 0.8s linear infinite', flexShrink:0 }} />
}

export default function DetailModal({ event, onClose, onAck }) {
  const [note, setNote] = useState('')
  const [acking, setAcking] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { setNote(''); setAcking(false); setDone(false) }, [event?.id])

  if (!event) return null

  const color = event.acknowledged ? '#555' : SEV_COLOR[event.severity] || C.textMuted

  const rows = [
    ['Status', event.acknowledged ? '✓ Acknowledged' : '⚠ ' + SEV_LABEL[event.severity], event.acknowledged ? C.healthy : color],
    ['Device', event.device, null],
    event.ip && ['IP Address', event.ip, null],
    event.component && ['Component', event.component, null],
    event.organization && ['Organization', event.organization, null],
    event.policy && ['Policy', event.policy, null],
    ['First occurrence', event.firstOccurrence, null],
    ['Last occurrence', event.lastOccurrence, null],
    ['Occurrence count', event.count + '×', null],
    event.acknowledged && event.ackUser && ['Acknowledged by', event.ackUser, C.healthy],
    event.acknowledged && event.ackNote && ['Note', event.ackNote, null],
  ].filter(Boolean)

  const doAck = async () => {
    setAcking(true)
    await onAck(event.id, note)
    setDone(true)
    setAcking(false)
    setTimeout(onClose, 900)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', maxHeight:'85vh', background:'#0e1e38', borderRadius:'20px 20px 0 0', overflowY:'auto', animation:'sl-slideup 0.3s cubic-bezier(0.22,1,0.36,1)' }}>

        <div style={{ width:40, height:4, background:C.border, borderRadius:2, margin:'12px auto 8px' }} />

        <div style={{ padding:'8px 20px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div style={{ fontSize:17, fontWeight:700, color:C.text, lineHeight:1.3 }}>{event.message}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.textMuted, fontSize:26, cursor:'pointer', flexShrink:0, lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:'4px 20px 16px' }}>
          {rows.map(([k, v, c], i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:`1px solid ${C.border}`, gap:12 }}>
              <span style={{ fontSize:13, color:C.textMuted, flexShrink:0, minWidth:100 }}>{k}</span>
              <span style={{ fontSize:13, color:c || C.text, textAlign:'right', wordBreak:'break-all' }}>{v}</span>
            </div>
          ))}
        </div>

        {!event.acknowledged && (
          <div style={{ padding:'0 20px 20px', borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Acknowledge note (optional)</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              style={{ width:'100%', background:C.navyLight, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, padding:'10px 12px', outline:'none', resize:'none', minHeight:80, fontFamily:'inherit' }} />
            <button onClick={doAck} disabled={acking || done}
              style={{ width:'100%', height:48, background: done ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#1a6fc4,#1560a8)', border:'none', borderRadius:10, color:done?'#666':'white', fontSize:16, fontWeight:600, cursor:done?'default':'pointer', marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:done?'none':'0 4px 16px rgba(26,111,196,0.3)' }}>
              {acking ? <><Spinner /> Processing...</> : done ? '✓ Acknowledged' : <><span>✓</span> Acknowledge Event</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
