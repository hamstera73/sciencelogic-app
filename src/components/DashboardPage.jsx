import { C, SEV_COLOR, SEV_LABEL } from '../constants.js'

function SummaryCard({ label, count, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:14, cursor:'pointer', position:'relative', overflow:'hidden', flex:1, minWidth:0, WebkitTapHighlightColor:'transparent' }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:color }} />
      <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:700, margin:'4px 0 2px', lineHeight:1, color }}>{count}</div>
      <div style={{ fontSize:11, color:C.textMuted }}>{label==='Acknowledged' ? 'Processed' : 'Active events'}</div>
    </div>
  )
}

function EventCard({ event, bulkMode, selected, onCardClick, onQuickAck }) {
  const color = event.acknowledged ? '#555' : SEV_COLOR[event.severity]
  return (
    <div onClick={() => onCardClick(event.id)}
      style={{ background: selected ? 'rgba(26,111,196,0.12)' : C.card, border:`1px solid ${selected?'rgba(26,111,196,0.3)':C.border}`, borderRadius:10, padding:14, cursor:'pointer', position:'relative', overflow:'hidden', WebkitTapHighlightColor:'transparent' }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:color }} />
      {bulkMode && !event.acknowledged && (
        <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${selected?C.blue:C.border}`, background:selected?C.blue:C.navyLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'white', marginBottom:6 }}>{selected?'✓':''}</div>
      )}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
        <span style={{ flexShrink:0, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.5px', background:`${color}33`, color }}>
          {event.acknowledged ? 'Acked' : SEV_LABEL[event.severity]}
        </span>
        <span style={{ fontSize:11, color:C.textMuted, flexShrink:0 }}>{event.time}</span>
      </div>
      <div style={{ fontSize:14, color:C.text, fontWeight:500, lineHeight:1.4, marginBottom:8 }}>{event.message}</div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:C.textMuted }}>🖥 {event.device}</span>
        {event.component && <span style={{ fontSize:12, color:C.textMuted }}>⚙️ {event.component}</span>}
        {event.count > 1 && <span style={{ fontSize:12, color:C.textMuted }}>🔁 {event.count}×</span>}
      </div>
      {!bulkMode && (
        event.acknowledged
          ? <button style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'7px 14px', borderRadius:6, border:'1px solid #444', background:'rgba(255,255,255,0.04)', color:'#666', fontSize:13, fontWeight:600, cursor:'default' }}>✓ Acknowledged door {event.ackUser||'user'}</button>
          : <button onClick={e=>{e.stopPropagation(); onQuickAck(event.id)}} style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'7px 14px', borderRadius:6, border:`1px solid ${C.blue}`, background:'rgba(26,111,196,0.15)', color:C.blueBright, fontSize:13, fontWeight:600, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>✓ Acknowledge</button>
      )}
    </div>
  )
}

export default function DashboardPage({
  events, filtered, counts, filter, setFilter,
  bulkMode, setBulkMode, selectedIds, setSelectedIds,
  refreshing, lastRefresh, onRefresh,
  onCardClick, onQuickAck,
  showNotifBanner, notifPerm, onRequestNotif, onDismissNotifBanner,
  onSelectAll, onBulkAck,
}) {
  const chips = [['all','All'],['critical','Critical'],['major','Major'],['minor','Minor'],['acked','Acknowledged']]

  return (
    <div style={{ animation:'sl-fadein 0.2s ease' }}>

      {/* Notification banner */}
      {showNotifBanner && notifPerm === 'default' && (
        <div style={{ margin:'8px 16px 0', padding:'10px 14px', background:'rgba(26,111,196,0.12)', border:'1px solid rgba(26,111,196,0.25)', borderRadius:8, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={onRequestNotif}>
          <span style={{ fontSize:16 }}>🔔</span>
          <span style={{ flex:1, fontSize:13, color:'rgba(33,150,243,0.9)', lineHeight:1.4 }}>Enable notifications for new critical events</span>
          <button onClick={e=>{e.stopPropagation(); onDismissNotifBanner()}} style={{ background:'none', border:'none', color:C.textMuted, fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Bulk bar */}
      {bulkMode && (
        <div style={{ background:C.navyMid, borderBottom:`1px solid ${C.border}`, padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ flex:1, fontSize:14, fontWeight:600, color:C.text }}>{selectedIds.size} selected</span>
          <button onClick={onSelectAll} style={{ height:36, padding:'0 12px', background:'none', border:`1px solid ${C.border}`, borderRadius:8, color:C.blueBright, fontSize:13, cursor:'pointer' }}>All</button>
          <button onClick={onBulkAck} disabled={selectedIds.size===0} style={{ height:36, padding:'0 16px', background:'linear-gradient(135deg,#1a6fc4,#1560a8)', border:'none', borderRadius:8, color:'white', fontSize:13, fontWeight:600, cursor:selectedIds.size===0?'default':'pointer', opacity:selectedIds.size===0?0.4:1 }}>
            ✓ Ack {selectedIds.size > 0 ? selectedIds.size + ' events' : 'alle'}
          </button>
          <button onClick={()=>{setBulkMode(false); setSelectedIds(new Set())}} style={{ height:36, padding:'0 12px', background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.textMuted, fontSize:13, cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Refresh row */}
      <div style={{ padding:'12px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:C.textMuted }}>{lastRefresh || 'Loading...'}</span>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>{if(bulkMode){setBulkMode(false);setSelectedIds(new Set())}else setBulkMode(true)}}
            style={{ height:32, padding:'0 12px', background:bulkMode?'rgba(26,111,196,0.15)':C.card, border:`1px solid ${bulkMode?'rgba(26,111,196,0.4)':C.border}`, borderRadius:8, color:bulkMode?C.blueBright:C.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            {bulkMode ? '✕ Annuleer' : '☑ Select'}
          </button>
          <button onClick={onRefresh} style={{ width:32, height:32, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.textMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, animation:refreshing?'sl-spin 0.8s linear infinite':'none', WebkitTapHighlightColor:'transparent' }}>↻</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', gap:10 }}>
          <SummaryCard label="Critical" count={counts.critical} color={C.critical} onClick={()=>setFilter('critical')} />
          <SummaryCard label="Major" count={counts.major} color={C.major} onClick={()=>setFilter('major')} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <SummaryCard label="Minor" count={counts.minor} color={C.minor} onClick={()=>setFilter('minor')} />
          <SummaryCard label="Acknowledged" count={counts.acked} color={C.healthy} onClick={()=>setFilter('acked')} />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 12px', overflowX:'auto', scrollbarWidth:'none' }}>
        {chips.map(([f,l]) => (
          <button key={f} onClick={()=>{setFilter(f); if(bulkMode){setBulkMode(false);setSelectedIds(new Set())}}}
            style={{ flexShrink:0, height:32, padding:'0 14px', borderRadius:16, border:`1px solid ${filter===f?({critical:C.critical,major:C.major,minor:C.minor}[f]||C.blue):C.border}`, background:filter===f?({critical:C.critical,major:C.major,minor:C.minor}[f]||C.blue):C.card, color:filter===f?'white':C.textMuted, fontSize:13, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div style={{ padding:'4px 16px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:13, fontWeight:600, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.5px' }}>Events</span>
        <span style={{ fontSize:12, color:C.textMuted }}>{filtered.length} events</span>
      </div>

      {/* Event list */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 32px', gap:12, textAlign:'center' }}>
            <div style={{ fontSize:48, opacity:0.3 }}>✅</div>
            <div style={{ fontSize:17, fontWeight:600, color:C.text }}>No events found</div>
            <div style={{ fontSize:14, color:C.textMuted, lineHeight:1.5 }}>There are no {filter==='all'?'active':''} events in this category.</div>
          </div>
        ) : filtered.map(e => (
          <EventCard key={e.id} event={e} bulkMode={bulkMode} selected={selectedIds.has(e.id)}
            onCardClick={onCardClick} onQuickAck={onQuickAck} />
        ))}
      </div>
      <div style={{ height:16 }} />
    </div>
  )
}
