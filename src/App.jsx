import { useState } from 'react'
import { C } from './constants.js'

const ANIM = `
@keyframes sl-spin { to { transform: rotate(360deg) } }
@keyframes sl-fadein { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
`

const AUTH_METHODS = [
  { id: 'basic',  label: 'Username & Password', icon: '🔑', desc: 'Direct Basic Auth to EM7 API' },
  { id: 'token',  label: 'API Token',           icon: '🪙', desc: 'Personal API token from EM7 profile' },
  { id: 'oidc',   label: 'OAuth2 / OpenID Connect', icon: '🔐', desc: 'Azure AD, Okta, Google, Keycloak' },
  { id: 'saml',   label: 'SAML 2.0',           icon: '🏢', desc: 'Azure AD, ADFS, Okta SAML' },
]

function inp(extra={}) {
  return {
    background: C.navyLight, border: `1px solid ${C.border}`, borderRadius: 10,
    color: C.text, fontSize: 16, padding: '0 14px', height: 48,
    outline: 'none', width: '100%', fontFamily: 'inherit', ...extra
  }
}

function Label({ children }) {
  return <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>{children}</div>
}

function Field({ label, children }) {
  return <div style={{ display:'flex', flexDirection:'column' }}><Label>{label}</Label>{children}</div>
}

export default function LoginPage({ onLogin }) {
  const [host, setHost] = useState('')
  const [method, setMethod] = useState('basic')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [token, setToken] = useState('')
  // OIDC fields
  const [oidcClientId, setOidcClientId] = useState('')
  const [oidcAuthUrl, setOidcAuthUrl] = useState('')
  const [oidcTokenUrl, setOidcTokenUrl] = useState('')
  const [oidcRedirect, setOidcRedirect] = useState(window.location.origin + window.location.pathname)
  // SAML fields
  const [samlIdpUrl, setSamlIdpUrl] = useState('')
  const [samlEntityId, setSamlEntityId] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async () => {
    setError('')

    // Demo mode
    if (!host && !user && !pass && !token) {
      onLogin({ host:'demo.sciencelogic.local', user:'demo_admin', pass:'', token:'', method:'basic', demoMode:true })
      return
    }

    if (!host) { setError('Please enter an API host.'); return }

    const cleanHost = host.replace(/\/$/, '')

    if (method === 'saml') {
      if (!samlIdpUrl) { setError('Please enter the SAML IdP SSO URL.'); return }
      // Redirect to SAML IdP — build AuthnRequest redirect
      const relayState = encodeURIComponent(JSON.stringify({ host: cleanHost, ts: Date.now() }))
      const spEntityId = encodeURIComponent(samlEntityId || window.location.origin)
      const acsUrl = encodeURIComponent(oidcRedirect)
      // Store pending login in sessionStorage for the callback
      sessionStorage.setItem('sl_saml_host', cleanHost)
      sessionStorage.setItem('sl_saml_pending', '1')
      window.location.href = `${samlIdpUrl}?SAMLRequest=PLACEHOLDER&RelayState=${relayState}&SPEntityId=${spEntityId}&AssertionConsumerServiceURL=${acsUrl}`
      return
    }

    if (method === 'oidc') {
      if (!oidcClientId) { setError('Please enter a Client ID.'); return }
      if (!oidcAuthUrl) { setError('Please enter the Authorization URL.'); return }
      // Store for callback
      sessionStorage.setItem('sl_oidc_host', cleanHost)
      sessionStorage.setItem('sl_oidc_client_id', oidcClientId)
      sessionStorage.setItem('sl_oidc_token_url', oidcTokenUrl)
      const state = Math.random().toString(36).slice(2)
      const codeVerifier = Math.random().toString(36).repeat(3).slice(0, 43)
      sessionStorage.setItem('sl_oidc_state', state)
      sessionStorage.setItem('sl_oidc_verifier', codeVerifier)
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: oidcClientId,
        redirect_uri: oidcRedirect,
        scope: 'openid profile email',
        state,
        code_challenge_method: 'plain',
        code_challenge: codeVerifier,
      })
      window.location.href = `${oidcAuthUrl}?${params}`
      return
    }

    // Proxy URL — same as in App.jsx
    const PROXY_URL = 'https://sl-em7-proxy.richard-hamstra.workers.dev'

    if (method === 'token') {
      if (!token) { setError('Please enter an API token.'); return }
      setLoading(true)
      try {
        const resp = await fetch(PROXY_URL + '/api/?limit=1', {
          headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json', 'X-EM7-Target': cleanHost },
          signal: AbortSignal.timeout(10000)
        })
        if (resp.status === 401 || resp.status === 403) throw new Error('Invalid token.')
        if (!resp.ok) throw new Error('API error: HTTP ' + resp.status)
        onLogin({ host: cleanHost, user: 'api-token-user', pass: '', token, method: 'token', demoMode: false })
      } catch(e) {
        let msg = e.message
        if (e.name === 'TimeoutError') msg = 'Connection timed out.'
        else if (msg.includes('fetch') || msg.includes('Network')) msg = 'Could not connect. Check CORS/HTTPS settings.'
        setError(msg)
        setLoading(false)
      }
      return
    }

    // Basic auth
    if (!user) { setError('Please enter a username.'); return }
    if (!pass) { setError('Please enter a password.'); return }
    setLoading(true)
    try {
      const credentials = btoa(user + ':' + pass)
      const resp = await fetch(PROXY_URL + '/api/?limit=1', {
        headers: { 'Authorization': 'Basic ' + credentials, 'Accept': 'application/json', 'X-EM7-Target': cleanHost },
        signal: AbortSignal.timeout(10000)
      })
      if (resp.status === 401 || resp.status === 403) throw new Error('Invalid credentials.')
      if (!resp.ok) throw new Error('API error: HTTP ' + resp.status)
      onLogin({ host: cleanHost, user, pass, token: '', method: 'basic', demoMode: false })
    } catch(e) {
      let msg = e.message
      if (e.name === 'TimeoutError') msg = 'Connection time-out.'
      else if (msg.includes('fetch') || msg.includes('Network')) msg = 'Could not connect. Check CORS/HTTPS settings.'
      setError(msg)
      setLoading(false)
    }
  }

  const selected = AUTH_METHODS.find(m => m.id === method)

  return (
    <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
      <style>{ANIM}</style>

      {/* Logo */}
      <div style={{ marginBottom:36, textAlign:'center' }}>
        <div style={{ width:72, height:72, background:'linear-gradient(135deg,#1a6fc4,#00b4d8)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:26, color:'white', margin:'0 auto 14px', letterSpacing:-1, boxShadow:'0 12px 40px rgba(26,111,196,0.4)' }}>SL</div>
        <div style={{ fontSize:22, fontWeight:700, color:C.text }}>ScienceLogic EM7</div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>Event Management Platform</div>
      </div>

      <div style={{ width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:16 }}>

        {/* Host */}
        <Field label="API Host">
          <input style={inp()} type="url" placeholder="https://your-instance.sciencelogic.com"
            value={host} onChange={e=>setHost(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} />
        </Field>

        {/* Auth method picker */}
        <div>
          <Label>Authentication method</Label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {AUTH_METHODS.map(m => (
              <div key={m.id} onClick={()=>setMethod(m.id)} style={{ background: method===m.id ? 'rgba(26,111,196,0.2)' : C.card, border:`1px solid ${method===m.id ? 'rgba(26,111,196,0.5)' : C.border}`, borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'all 0.15s' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{m.icon}</div>
                <div style={{ fontSize:13, fontWeight:600, color: method===m.id ? C.blueBright : C.text, lineHeight:1.3 }}>{m.label}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2, lineHeight:1.3 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Basic auth fields */}
        {method === 'basic' && <>
          <Field label="Username">
            <input style={inp()} type="text" placeholder="em7admin"
              value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} />
          </Field>
          <Field label="Password">
            <div style={{ position:'relative' }}>
              <input style={inp({ paddingRight:44 })} type={showPass?'text':'password'} placeholder="••••••••"
                value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} />
              <button onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontSize:16 }}>{showPass?'🙈':'👁'}</button>
            </div>
          </Field>
        </>}

        {/* Token fields */}
        {method === 'token' && <>
          <Field label="API Token">
            <input style={inp()} type="password" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={token} onChange={e=>setToken(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} />
          </Field>
          <div style={{ fontSize:12, color:C.textMuted, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', lineHeight:1.6 }}>
            📌 Generate an API token via <strong style={{color:C.text}}>EM7 → My Profile → API Tokens → New token</strong>
          </div>
        </>}

        {/* OIDC fields */}
        {method === 'oidc' && <>
          <Field label="Client ID">
            <input style={inp()} type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={oidcClientId} onChange={e=>setOidcClientId(e.target.value)} />
          </Field>
          <Field label="Authorization URL">
            <input style={inp()} type="url" placeholder="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
              value={oidcAuthUrl} onChange={e=>setOidcAuthUrl(e.target.value)} />
          </Field>
          <Field label="Token URL (optional)">
            <input style={inp()} type="url" placeholder="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
              value={oidcTokenUrl} onChange={e=>setOidcTokenUrl(e.target.value)} />
          </Field>
          <Field label="Redirect URI">
            <input style={inp()} type="url" value={oidcRedirect} onChange={e=>setOidcRedirect(e.target.value)} />
          </Field>
          <div style={{ fontSize:12, color:C.textMuted, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', lineHeight:1.6 }}>
            📌 Register <strong style={{color:C.text}}>{oidcRedirect}</strong> as Redirect URI in your identity provider.
          </div>
        </>}

        {/* SAML fields */}
        {method === 'saml' && <>
          <Field label="IdP SSO URL">
            <input style={inp()} type="url" placeholder="https://login.microsoftonline.com/{tenant}/saml2"
              value={samlIdpUrl} onChange={e=>setSamlIdpUrl(e.target.value)} />
          </Field>
          <Field label="SP Entity ID (optional)">
            <input style={inp()} type="text" placeholder={window.location.origin}
              value={samlEntityId} onChange={e=>setSamlEntityId(e.target.value)} />
          </Field>
          <div style={{ fontSize:12, color:C.textMuted, background:'rgba(251,192,45,0.08)', border:'1px solid rgba(251,192,45,0.2)', borderRadius:8, padding:'10px 12px', lineHeight:1.6 }}>
            ⚠️ SAML requires configuration on the IdP. Set the ACS URL to: <strong style={{color:C.text, wordBreak:'break-all'}}>{oidcRedirect}</strong>
          </div>
        </>}

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(229,57,53,0.15)', border:'1px solid rgba(229,57,53,0.3)', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#ff6b6b' }}>{error}</div>
        )}

        {/* Demo note */}
        <div style={{ background:'rgba(26,111,196,0.1)', border:'1px solid rgba(26,111,196,0.2)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'rgba(33,150,243,0.9)', lineHeight:1.5 }}>
          💡 <strong>Demo:</strong> Leave all fields empty and click Sign In for sample data.
        </div>

        {/* Login button */}
        <button onClick={doLogin} disabled={loading} style={{ height:50, background:'linear-gradient(135deg,#1a6fc4,#1560a8)', border:'none', borderRadius:10, color:'white', fontSize:16, fontWeight:600, cursor:loading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 20px rgba(26,111,196,0.35)', opacity:loading?0.7:1 }}>
          {loading
            ? <><div style={{ width:20, height:20, border:`2px solid rgba(255,255,255,0.3)`, borderTopColor:'white', borderRadius:'50%', animation:'sl-spin 0.8s linear infinite' }} /> Connecting...</>
            : method==='oidc' || method==='saml'
              ? <>{selected.icon} Continue to {method==='oidc'?'Identity Provider':'SAML IdP'}</>
              : 'Sign In'
          }
        </button>
      </div>
    </div>
  )
}
