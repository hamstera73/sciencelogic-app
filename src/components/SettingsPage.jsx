import { C } from '../constants.js'

const AUTH_METHOD_LABELS = { basic:'Username & wachtwoord', token:'API Token', oidc:'OAuth2 / OpenID Connect', saml:'SAML 2.0' }

export default function SettingsPage({ creds, notifPerm, onRequestNotif, onLogout }) {
  const sections = [
    { title:'Connection', items:[
      { icon:'🔗', label:'API Host', sub: creds?.host },
      { icon:'👤', label:'User', sub: creds?.user },
      { icon:'🔐', label:'Auth method', sub: AUTH_METHOD_LABELS[creds?.method] || creds?.method },
      { icon:'🟢', label:'Status', sub:'Connected', right:<span style={{color:'#43a047',fontSize:18}}>●</span> },
    ]},
    { title:'Notifications', items:[
      { icon:'📳', label:'Browser meldingen',
        sub: notifPerm==='granted' ? 'Enabled — critical events trigger a notification'
           : notifPerm==='denied' ? 'Blocked in browser settings'
           : 'Not enabled',
        right: (
          <button onClick={onRequestNotif} style={{
            height:34, padding:'0 14px', borderRadius:8, fontSize:13, cursor:'pointer', whiteSpace:'nowrap',
            border:`1px solid ${notifPerm==='granted'?'rgba(67,160,71,0.4)':notifPerm==='denied'?'rgba(229,57,53,0.3)':C.border}`,
            background: notifPerm==='granted'?'rgba(67,160,71,0.1)':notifPerm==='denied'?'rgba(229,57,53,0.1)':C.card,
            color: notifPerm==='granted'?'#43a047':notifPerm==='denied'?'#ff6b6b':C.textMuted,
          }}>
            {notifPerm==='granted'?'✓ Enabled':notifPerm==='denied'?'Blocked':'Enable'}
          </button>
        )
      },
    ]},
    { title:'Automatisch vernieuwen', items:[
      { icon:'⏱', label:'Interval', sub:'Every 60 seconds', right:<span style={{color:C.textMuted,fontSize:14}}>60s</span> },
    ]},
    { title:'About', items:[
      { icon:'ℹ️', label:'App version', right:<span style={{color:C.textMuted,fontSize:14}}>1.0.0</span> },
      { icon:'📡', label:'API version', right:<span style={{color:C.textMuted,fontSize:14}}>EM7 v2</span> },
      { icon:'🌐', label:'Platform', right:<span style={{color:C.textMuted,fontSize:14}}>PWA</span> },
    ]},
  ]

  return (
    <div style={{ animation:'sl-fadein 0.2s ease' }}>
      <div style={{ padding:'16px 16px 8px', fontSize:20, fontWeight:700, color:C.text }}>Settings</div>

      {sections.map(section => (
        <div key={section.title} style={{ padding:'0 16px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:8 }}>{section.title}</div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            {section.items.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', padding:'14px 16px', borderBottom: i < section.items.length-1 ? `1px solid ${C.border}` : 'none', gap:12 }}>
                <span style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, color:C.text }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize:12, color:C.textMuted, marginTop:2, overflow:'hidden', textAboutflow:'ellipsis', whiteSpace:'nowrap' }}>{item.sub}</div>}
                </div>
                {item.right}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ padding:'0 16px 32px' }}>
        <button onClick={onLogout} style={{ width:'100%', height:48, background:'rgba(229,57,53,0.15)', border:'1px solid rgba(229,57,53,0.3)', borderRadius:10, color:'#e53935', fontSize:16, fontWeight:600, cursor:'pointer' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
