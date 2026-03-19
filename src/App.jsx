import { useState, useEffect, useRef, useCallback } from 'react'
import { C, DEMO_EVENTS, mapSeverity } from './constants.js'
import LoginPage from './components/LoginPage.jsx'
import DashboardPage from './components/DashboardPage.jsx'
import DetailModal from './components/DetailModal.jsx'
import SettingsPage from './components/SettingsPage.jsx'

const GLOBAL_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body { background:#0a1628; }
  @keyframes sl-spin { to { transform:rotate(360deg) } }
  @keyframes sl-fadein { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }
  @keyframes sl-slideup { from { transform:translateY(100%) } to { transform:translateY(0) } }
  ::-webkit-scrollbar { display:none }
  input, textarea, button { font-family:inherit; }
  input::placeholder, textarea::placeholder { color:#8a9bb5; }
`

function Spinner({ size=36, border=3 }) {
  return <div style={{ width:size, height:size, border:`${border}px solid ${C.border}`, borderTopColor:C.blue, borderRadius:'50%', animation:'sl-spin 0.8s linear infinite' }} />
}

function Toast({ msg, type, visible }) {
  return (
    <div style={{ position:'fixed', bottom:76, left:16, right:16, background:'#1d2d44', border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 16px', fontSize:14, color:C.text, zIndex:200, transform:visible?'translateY(0)':'translateY(16px)', opacity:visible?1:0, transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)', display:'flex', alignItems:'center', gap:8, pointerEvents:'none' }}>
      <span style={{ color:type==='success'?C.healthy:C.critical, fontWeight:700 }}>{type==='success'?'✓':'✕'}</span>
      {msg}
    </div>
  )
}

// Handle OAuth2 callback (code in URL params)
function extractOidcCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  if (!code) return null
  const savedState = sessionStorage.getItem('sl_oidc_state')
  if (state !== savedState) return null
  return {
    code,
    host: sessionStorage.getItem('sl_oidc_host'),
    clientId: sessionStorage.getItem('sl_oidc_client_id'),
    tokenUrl: sessionStorage.getItem('sl_oidc_token_url'),
    verifier: sessionStorage.getItem('sl_oidc_verifier'),
  }
}

export default function App() {
  const [screen, setScreen] = useState('login')
  const [tab, setTab] = useState('dashboard')
  const [creds, setCreds] = useState(null)
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [modalEvent, setModalEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState('')
  const [toast, setToast] = useState({ msg:'', type:'success', visible:false })
  const [notifPerm, setNotifPerm] = useState('default')
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const knownCriticals = useRef(new Set())
  const refreshTimer = useRef(null)

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type, visible:true })
    setTimeout(() => setToast(t => ({...t, visible:false})), 3000)
  }, [])

  // Check OIDC callback on mount
  useEffect(() => {
    const cb = extractOidcCallback()
    if (cb && cb.host) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
      sessionStorage.removeItem('sl_oidc_state')
      // Exchange code for token if token URL provided
      if (cb.tokenUrl) {
        exchangeOidcCode(cb)
      } else {
        // Just use the code directly as bearer token (non-standard but some EM7 setups)
        enterApp({ host:cb.host, user:'sso-user', pass:'', token:cb.code, method:'oidc', demoMode:false })
      }
    }
  }, [])

  const exchangeOidcCode = async (cb) => {
    setLoading(true)
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: cb.code,
        client_id: cb.clientId,
        redirect_uri: window.location.origin + window.location.pathname,
        code_verifier: cb.verifier,
      })
      const resp = await fetch(cb.tokenUrl, { method:'POST', body, headers:{ 'Content-Type':'application/x-www-form-urlencoded' } })
      if (!resp.ok) throw new Error('Token exchange failed: HTTP ' + resp.status)
      const data = await resp.json()
      const token = data.access_token
      if (!token) throw new Error('Geen access_token ontvangen')
      enterApp({ host:cb.host, user: data.preferred_username || 'sso-user', pass:'', token, method:'oidc', demoMode:false })
    } catch(e) {
      setLoading(false)
      showToast('SSO failed: ' + e.message, 'error')
    }
  }

  const apiHeaders = useCallback((c=creds) => {
    if (!c) return {}
    if (c.method === 'token' || c.method === 'oidc') return { 'Authorization':'Bearer '+c.token, 'Accept':'application/json', 'X-em7-beautify-response':'1' }
    return { 'Authorization':'Basic '+btoa(c.user+':'+c.pass), 'Accept':'application/json', 'X-em7-beautify-response':'1' }
  }, [creds])

  const loadEvents = useCallback(async (c=creds) => {
    if (!c) return
    setRefreshing(true)

    if (c.demoMode) {
      await new Promise(r => setTimeout(r, 600))
      setEvents(prev => {
        const fresh = JSON.parse(JSON.stringify(DEMO_EVENTS))
        fresh.forEach(e => { const ex=prev.find(x=>x.id===e.id); if(ex?.acknowledged){e.acknowledged=true;e.ackUser=ex.ackUser;e.ackNote=ex.ackNote} })
        if (Notification.permission==='granted') {
          fresh.filter(e=>e.severity==='critical'&&!e.acknowledged&&!knownCriticals.current.has(e.id)).forEach(e=>{
            knownCriticals.current.add(e.id)
            try { const n=new Notification('⚠ Critical — ScienceLogic',{body:e.device+': '+e.message,tag:e.id}); setTimeout(()=>n.close(),8000) } catch{}
          })
        }
        return fresh
      })
      setLastRefresh('Updated at '+new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}))
      setRefreshing(false)
      return
    }

    try {
      const resp = await fetch(c.host+'/api/event_policy?filter.0.severity.gte=3&limit=100&extended_fetch=1', { headers:apiHeaders(c), signal:AbortSignal.timeout(15000) })
      if (!resp.ok) throw new Error('HTTP '+resp.status)
      const data = await resp.json()
      const mapped = (data.result_set||[]).map((e,i) => ({
        id: e.URI||('e'+i), severity:mapSeverity(e.severity||e.event_severity),
        message: e.message||e.event_message||'Geen beschrijving',
        device: e.device_name||e.aligned_device||'Onbekend', ip:e.ip||'', component:e.component||'',
        time: '', firstOccurrence:e.date_first||'', lastOccurrence:e.last_occurrence||'',
        count: parseInt(e.occurrence_count||1),
        acknowledged: e.ack==='1'||e.acknowledged===true,
        ackUser:e.ack_user||'', ackNote:e.ack_note||'', policy:e.policy_name||'', organization:e.organization||''
      }))
      if (Notification.permission==='granted') {
        mapped.filter(e=>e.severity==='critical'&&!e.acknowledged&&!knownCriticals.current.has(e.id)).forEach(e=>{
          knownCriticals.current.add(e.id)
          try { const n=new Notification('⚠ Critical — ScienceLogic',{body:e.device+': '+e.message,tag:e.id}); setTimeout(()=>n.close(),8000) } catch{}
        })
      }
      setEvents(mapped)
      setLastRefresh('Updated at '+new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}))
    } catch(e) { showToast('Refresh failed: '+e.message, 'error') }
    setRefreshing(false)
  }, [creds, apiHeaders, showToast])

  const enterApp = useCallback((c) => {
    setCreds(c)
    setScreen('loading')
    setTimeout(() => {
      setScreen('app')
      loadEvents(c)
      refreshTimer.current = setInterval(() => loadEvents(c), 60000)
      if ('Notification' in window) {
        setNotifPerm(Notification.permission)
        if (Notification.permission==='default') setTimeout(()=>setShowNotifBanner(true), 2000)
      }
    }, 800)
  }, [loadEvents])

  const doLogout = () => {
    clearInterval(refreshTimer.current)
    setCreds(null); setEvents([]); setScreen('login'); setTab('dashboard')
    setBulkMode(false); setSelectedIds(new Set()); knownCriticals.current=new Set()
    setFilter('all'); setLastRefresh('')
  }

  const requestNotif = async () => {
    if (!('Notification' in window)) { showToast('Not supported in this browser','error'); return }
    if (Notification.permission==='denied') { showToast('Blocked — change in browser settings','error'); return }
    const r = await Notification.requestPermission()
    setNotifPerm(r); setShowNotifBanner(false)
    if (r==='granted') showToast('Notifications enabled!')
  }

  const ackEvent = useCallback(async (id, note='') => {
    if (creds?.demoMode) {
      await new Promise(r=>setTimeout(r,500))
      setEvents(prev=>prev.map(e=>e.id===id?{...e,acknowledged:true,ackUser:'demo_admin',ackNote:note}:e))
      showToast('Event acknowledged')
      return
    }
    try {
      const resp = await fetch(creds.host+'/api/event/'+id+'/acknowledge', { method:'POST', headers:{...apiHeaders(),'Content-Type':'application/json'}, body:JSON.stringify({ack:1,note}) })
      if (!resp.ok) throw new Error('HTTP '+resp.status)
      setEvents(prev=>prev.map(e=>e.id===id?{...e,acknowledged:true,ackUser:creds.user,ackNote:note}:e))
      showToast('Event acknowledged')
    } catch(e) { showToast('Acknowledge failed: '+e.message,'error') }
  }, [creds, apiHeaders, showToast])

  const bulkAck = async () => {
    const ids = [...selectedIds]; let ok=0, fail=0
    for (const id of ids) {
      try {
        if (creds?.demoMode) { await new Promise(r=>setTimeout(r,60)); setEvents(prev=>prev.map(e=>e.id===id?{...e,acknowledged:true,ackUser:'demo_admin'}:e)); ok++ }
        else {
          const resp=await fetch(creds.host+'/api/event/'+id+'/acknowledge',{method:'POST',headers:{...apiHeaders(),'Content-Type':'application/json'},body:JSON.stringify({ack:1})})
          if(!resp.ok) throw new Error(); setEvents(prev=>prev.map(e=>e.id===id?{...e,acknowledged:true,ackUser:creds.user}:e)); ok++
        }
      } catch { fail++ }
    }
    setBulkMode(false); setSelectedIds(new Set())
    if(fail===0) showToast(`✓ ${ok} event${ok!==1?'s':''} acknowledged`)
    else showToast(`${ok} succeeded, ${fail} failed`,'error')
  }

  const filtered = events.filter(e => {
    if (filter==='all') return !e.acknowledged
    if (filter==='acked') return e.acknowledged
    if (['critical','major','minor'].includes(filter)) return e.severity===filter&&!e.acknowledged
    return true
  })

  const counts = {
    critical: events.filter(e=>e.severity==='critical'&&!e.acknowledged).length,
    major: events.filter(e=>e.severity==='major'&&!e.acknowledged).length,
    minor: events.filter(e=>e.severity==='minor'&&!e.acknowledged).length,
    acked: events.filter(e=>e.acknowledged).length,
  }

  const onSelectAll = () => {
    const eligible = filtered.filter(e=>!e.acknowledged)
    const allSel = eligible.every(e=>selectedIds.has(e.id))
    setSelectedIds(allSel ? new Set() : new Set(eligible.map(e=>e.id)))
  }

  const baseStyle = { fontFamily:"-apple-system,'SF Pro Display','Segoe UI',Roboto,sans-serif", background:C.navy, color:C.text, height:'100dvh', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }

  if (screen==='login') return (
    <div style={baseStyle}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ flex:1, overflowY:'auto', WebkitAboutflowScrolling:'touch' }}>
        <LoginPage onLogin={enterApp} />
      </div>
    </div>
  )

  if (screen==='loading') return (
    <div style={{...baseStyle, alignItems:'center', justifyContent:'center', gap:16}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:56, height:56, background:'linear-gradient(135deg,#1a6fc4,#00b4d8)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:20, color:'white', letterSpacing:-1 }}>SL</div>
      <Spinner />
      <div style={{ fontSize:14, color:C.textMuted }}>Connecting...</div>
    </div>
  )

  return (
    <div style={baseStyle}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ height:56, background:C.navyMid, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
        <div style={{ width:32, height:32, background:'linear-gradient(135deg,#1a6fc4,#00b4d8)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'white', letterSpacing:'-0.5px', flexShrink:0 }}>SL</div>
        <div>
          <div style={{ fontSize:17, fontWeight:600, color:C.text, letterSpacing:'-0.3px' }}>ScienceLogic</div>
          <div style={{ fontSize:11, color:C.textMuted }}>{creds?.demoMode ? 'Demo mode' : creds?.host?.replace('https://','')}</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.healthy, boxShadow:`0 0 0 3px ${C.healthy}33` }} />
        </div>
      </div>
      <div style={{ height:2, background:'linear-gradient(90deg,#1a6fc4,#00b4d8,transparent)', flexShrink:0 }} />

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitAboutflowScrolling:'touch', paddingBottom:64 }}>
        {tab==='dashboard' && (
          <DashboardPage
            events={events} filtered={filtered} counts={counts}
            filter={filter} setFilter={setFilter}
            bulkMode={bulkMode} setBulkMode={setBulkMode}
            selectedIds={selectedIds} setSelectedIds={setSelectedIds}
            refreshing={refreshing} lastRefresh={lastRefresh}
            onRefresh={()=>loadEvents()}
            onCardClick={id => {
              if (bulkMode) {
                const ev = events.find(e=>e.id===id)
                if (!ev||ev.acknowledged) return
                setSelectedIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
              } else {
                setModalEvent(events.find(e=>e.id===id))
              }
            }}
            onQuickAck={id=>ackEvent(id)}
            showNotifBanner={showNotifBanner} notifPerm={notifPerm}
            onRequestNotif={requestNotif} onDismissNotifBanner={()=>setShowNotifBanner(false)}
            onSelectAll={onSelectAll} onBulkAck={bulkAck}
          />
        )}
        {tab==='settings' && (
          <SettingsPage creds={creds} notifPerm={notifPerm} onRequestNotif={requestNotif} onLogout={doLogout} />
        )}
      </div>

      {/* Tab bar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, height:64, background:C.navyMid, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:50 }}>
        {[['dashboard','Dashboard','▦'],['settings','Settings','⚙']].map(([t,l,icon])=>(
          <div key={t} onClick={()=>setTab(t)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', color:tab===t?C.blueBright:C.textMuted, paddingTop:6, position:'relative', WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:22 }}>{icon}</span>
            <span style={{ fontSize:11, fontWeight:500 }}>{l}</span>
            {t==='dashboard' && counts.critical>0 && (
              <div style={{ position:'absolute', top:4, right:'calc(50% - 20px)', background:C.critical, color:'white', fontSize:10, fontWeight:700, minWidth:18, height:18, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{counts.critical}</div>
            )}
          </div>
        ))}
      </div>

      {modalEvent && (
        <DetailModal
          event={events.find(e=>e.id===modalEvent.id)}
          onClose={()=>setModalEvent(null)}
          onAck={async(id,note)=>{ await ackEvent(id,note) }}
        />
      )}

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  )
}
