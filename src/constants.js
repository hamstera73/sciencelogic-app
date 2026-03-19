export const C = {
  navy: '#0a1628', navyMid: '#0e1e38', navyLight: '#162a4a',
  blue: '#1a6fc4', blueBright: '#2196f3', cyan: '#00b4d8',
  critical: '#e53935', major: '#f57c00', minor: '#fbc02d', healthy: '#43a047',
  text: '#e8edf4', textMuted: '#8a9bb5',
  border: 'rgba(255,255,255,0.08)',
  card: 'rgba(255,255,255,0.04)',
  cardHover: 'rgba(255,255,255,0.08)',
}

export const SEV_COLOR = { critical: C.critical, major: C.major, minor: C.minor }
export const SEV_LABEL = { critical: 'Critical', major: 'Major', minor: 'Minor' }

export const mapSeverity = n => {
  const s = parseInt(n)
  if (s >= 5) return 'critical'
  if (s === 4) return 'major'
  return 'minor'
}

export const DEMO_EVENTS = [
  { id:'e001', severity:'critical', message:'CPU utilization > 95% for 10 minutes', device:'srv-prod-web01', ip:'10.0.1.10', component:'CPU', time:'2 min ago', firstOccurrence:'2026-03-12 13:42:01', lastOccurrence:'2026-03-12 13:52:01', count:12, acknowledged:false, ackUser:'', ackNote:'', policy:'CPU High Utilization', organization:'Production' },
  { id:'e002', severity:'critical', message:'Disk /var/log vol (98%) - write errors detected', device:'srv-prod-db02', ip:'10.0.1.21', component:'Disk', time:'5 min ago', firstOccurrence:'2026-03-12 13:47:30', lastOccurrence:'2026-03-12 13:52:55', count:3, acknowledged:false, ackUser:'', ackNote:'', policy:'Disk Full Alert', organization:'Production' },
  { id:'e003', severity:'critical', message:'Netwerkinterface eth0 down - no link detected', device:'sw-core-01', ip:'10.0.0.1', component:'Netwerk', time:'8 min ago', firstOccurrence:'2026-03-12 13:44:10', lastOccurrence:'2026-03-12 13:52:10', count:1, acknowledged:false, ackUser:'', ackNote:'', policy:'Interface Down', organization:'Network' },
  { id:'e004', severity:'major', message:'Memory usage 87% - paging active', device:'srv-app-03', ip:'10.0.2.13', component:'Memory', time:'12 min ago', firstOccurrence:'2026-03-12 13:40:00', lastOccurrence:'2026-03-12 13:52:00', count:7, acknowledged:false, ackUser:'', ackNote:'', policy:'Memory High Usage', organization:'Applications' },
  { id:'e005', severity:'major', message:'MySQL replication lag > 30 seconds', device:'srv-prod-db03', ip:'10.0.1.22', component:'MySQL', time:'18 min ago', firstOccurrence:'2026-03-12 13:34:00', lastOccurrence:'2026-03-12 13:52:00', count:5, acknowledged:false, ackUser:'', ackNote:'', policy:'Database Replication Lag', organization:'Production' },
  { id:'e006', severity:'major', message:'HTTPS certificate expires in 14 days', device:'lb-prod-01', ip:'10.0.0.10', component:'SSL', time:'2 hrs ago', firstOccurrence:'2026-03-12 11:52:00', lastOccurrence:'2026-03-12 11:52:00', count:1, acknowledged:false, ackUser:'', ackNote:'', policy:'SSL Certificate Expiry', organization:'Production' },
  { id:'e007', severity:'minor', message:'Backup job took longer than expected (4h15m)', device:'srv-backup-01', ip:'10.0.3.5', component:'Backup', time:'1 hr ago', firstOccurrence:'2026-03-12 12:52:00', lastOccurrence:'2026-03-12 12:52:00', count:1, acknowledged:false, ackUser:'', ackNote:'', policy:'Backup Duration Warning', organization:'Infrastructure' },
  { id:'e008', severity:'minor', message:'NTP time sync drift > 5 seconds', device:'srv-prod-app04', ip:'10.0.2.14', component:'NTP', time:'45 min ago', firstOccurrence:'2026-03-12 13:07:00', lastOccurrence:'2026-03-12 13:07:00', count:2, acknowledged:false, ackUser:'', ackNote:'', policy:'NTP Drift', organization:'Applications' },
  { id:'e009', severity:'critical', message:'RAID array degraded - 1 disk failed', device:'srv-stor-01', ip:'10.0.4.1', component:'RAID/Storage', time:'25 min ago', firstOccurrence:'2026-03-12 13:27:00', lastOccurrence:'2026-03-12 13:27:00', count:1, acknowledged:false, ackUser:'', ackNote:'', policy:'RAID Degraded', organization:'Infrastructure' },
  { id:'e010', severity:'major', message:'API response time > 3000ms (p95)', device:'srv-api-02', ip:'10.0.2.2', component:'API Gateway', time:'32 min ago', firstOccurrence:'2026-03-12 13:20:00', lastOccurrence:'2026-03-12 13:52:00', count:18, acknowledged:false, ackUser:'', ackNote:'', policy:'API Latency Alert', organization:'Applications' },
]
