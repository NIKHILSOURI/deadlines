/* Deadline Tracker v3. Single-page app, no build step. */
(() => {
'use strict';

/* =========================================================
   Constants
   ========================================================= */
const VERSION = '3.0.0';
const KEY = 'dt3', AUTH_KEY = 'dt3-auth', V2_KEY = 'deadline-tracker-v2', V1_KEY = 'deadline-tracker-v1';
const DAY = 864e5, HOUR = 36e5, MIN = 6e4;
const SCOPE = 'https://www.googleapis.com/auth/calendar';
const API = 'https://www.googleapis.com/calendar/v3';
const CONFIG_ID = 'dtconfig00';
const FOOTER_RE = /\n*\[Deadline Tracker[^\]]*\]\s*$/;

// Google Calendar event colors, so a group looks the same in both apps
const GCOLORS = {1:'#7986CB',2:'#33B679',3:'#8E24AA',4:'#E67C73',5:'#F6BF26',6:'#F4511E',7:'#039BE5',8:'#616161',9:'#3F51B5',10:'#0B8043',11:'#D50000'};
const GNAMES = {1:'Lavender',2:'Sage',3:'Grape',4:'Flamingo',5:'Banana',6:'Tangerine',7:'Peacock',8:'Graphite',9:'Blueberry',10:'Basil',11:'Tomato'};
const ORDER = [9,10,6,3,7,2,4,11,1,5,8];
const REMINDERS = [[10080,'1 week'],[4320,'3 days'],[1440,'1 day'],[180,'3 hours'],[60,'1 hour']];

const TYPES = ['Task','Assignment','Quiz','Exam','Abstract deadline','Paper submission','Rebuttal','Notification',
  'Camera-ready','Registration','Conference','Revision due','Show progress','Milestone','Application','Other'];
const TEMPLATES = {
  Conference:[['Abstract deadline','Abstract deadline'],['Paper submission','Paper submission'],['Rebuttal','Rebuttal'],
    ['Notification','Notification'],['Camera-ready','Camera-ready'],['Registration','Registration'],['Conference','Conference starts']],
  Journal:[['Paper submission','Submit manuscript'],['Notification','First decision'],['Revision due','Revision due'],['Camera-ready','Final files']],
  Course:[['Assignment','Assignment 1'],['Quiz','Quiz 1'],['Exam','Exam']],
  Project:[['Show progress','Show progress to professor'],['Milestone','Milestone']],
  'Meeting series':[['Task','Prepare agenda']],
  Application:[['Application','Application deadline'],['Notification','Result']],
  Other:[['Task','Task']]
};
const SEED = [['Course work','Course'],['GEM network delay paper','Conference'],['NSMR paper','Conference'],['SHARP (CIKM)','Conference'],
  ['EB-RAG camera-ready','Conference'],['FedRAG-Debt','Conference'],['SciVis 2026','Conference'],['GenAI XR survey','Project'],
  ['XR SLR revision','Journal'],['Hopfield player modeling','Project'],['ICMI NPC paper','Conference'],['PlayerMind','Project'],
  ['Decentraland valuation','Project'],['3D primitive video','Project'],['PhD / MTech plan','Application']];

const ICON = {
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>', down:'<path d="M6 9l6 6 6-6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  alert:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
const ic = (n, cls = '') => `<svg viewBox="0 0 24 24" class="i ${cls}" aria-hidden="true">${ICON[n]}</svg>`;

/* =========================================================
   Utilities
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parseD(a) - parseD(b)) / DAY);
const todayISO = () => iso(new Date());
const fmtD = (s, o) => parseD(s).toLocaleDateString('en-GB', o || {weekday:'short', day:'numeric', month:'short'});
const fmtT = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const B32 = '0123456789abcdefghijklmnopqrstuv';
const genId = () => { let s = 'dt'; for (const x of crypto.getRandomValues(new Uint8Array(22))) s += B32[x & 31]; return s; };
const slug = s => String(s || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
const motionOK = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
const weekStart = s => { const d = parseD(s); const off = (d.getDay() + 6) % 7; return addDays(s, -off); };
const relDay = n => n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 0 ? `In ${n} days` : `${-n} days ago`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* =========================================================
   State and storage
   ========================================================= */
function defaultSettings(){
  return { theme:'system', clientId:'', connected:false, email:'', deadlineCalId:'', calendars:['primary'], calMeta:{},
    reminders:[4320,1440], defaultTz:'local', notify:false, lastDigest:'', notified:{} };
}
function freshState(){
  return { v:3, settings: defaultSettings(),
    groups: SEED.map(([name, kind], k) => ({ id: genId(), name, kind, color: ORDER[k % ORDER.length], tag: slug(name) })),
    groupsUpdated: 0, deadlines: [], meetings: [], queue: [], lastSync: 0, meetRange: null };
}
function load(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 3){
      const st = Object.assign(freshState(), s);
      st.settings = Object.assign(defaultSettings(), s.settings);
      return st;
    }
  }catch(e){}
  const st = freshState();
  // bring over data from the laptop versions if they ran in this browser
  try{
    const v2 = JSON.parse(localStorage.getItem(V2_KEY) || localStorage.getItem(V1_KEY) || 'null');
    if (v2 && Array.isArray(v2.items) && v2.items.length) importOld(st, v2);
  }catch(e){}
  return st;
}
let state = load();
let saveFail = false;
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); saveFail = false; }
  catch(e){ if (!saveFail) toast('Could not save on this device. Make a backup from Settings.'); saveFail = true; }
}

function groupByName(st, name, create){
  const n = String(name || '').trim() || 'General';
  let g = st.groups.find(x => x.name.toLowerCase() === n.toLowerCase());
  if (!g && create){
    g = { id: genId(), name: n, kind: 'Other', color: ORDER[st.groups.length % ORDER.length], tag: slug(n) };
    st.groups.push(g);
    st.groupsUpdated = Date.now();
    if (st === state) enqueue({ t:'cfg' });
  }
  return g;
}

// imports a backup from the laptop versions (v1 had "project", v2 had "groupId")
function importOld(st, old){
  const map = {};
  (old.groups || []).forEach(g => {
    const ng = groupByName(st, g.name, true);
    ng.kind = g.kind || ng.kind;
    map[g.id] = ng;
  });
  (old.items || []).forEach(i => {
    if (!i || !i.title || !i.date) return;
    const g = map[i.groupId] || groupByName(st, i.project || 'General', true);
    const d = { id: genId(), title: String(i.title), groupId: g.id, type: TYPES.includes(i.type) ? i.type : (i.type || 'Task'),
      date: i.date, time: i.time || '', tz: 'local', notes: i.notes || '', done: !!i.done, updated: Date.now() };
    st.deadlines.push(d);
    st.queue.push({ t:'d', id: d.id });
  });
  st.groupsUpdated = Date.now();
  st.queue.push({ t:'cfg' });
}

/* ---------- queue of changes waiting for Google ---------- */
function enqueue(op){
  const k = op.t + ':' + (op.id || '');
  state.queue = state.queue.filter(q => (q.t + ':' + (q.id || '')) !== k);
  state.queue.push(op);
}
const pendingSet = t => new Set(state.queue.filter(q => q.t === t).map(q => q.id));

/* ---------- lookups ---------- */
const NOGROUP = { id:'', name:'General', color:8, kind:'Other', tag:'' };
const G = id => state.groups.find(g => g.id === id) || NOGROUP;
const gcol = c => GCOLORS[c] || GCOLORS[8];
const findD = id => state.deadlines.find(d => d.id === id);
const findM = id => state.meetings.find(m => m.id === id);

/* ---------- deadline time math ---------- */
function dueAt(d){
  const [y, m, dd] = d.date.split('-').map(Number);
  if (!d.time) return new Date(y, m - 1, dd, 23, 59, 59);
  const [h, mi] = d.time.split(':').map(Number);
  if (d.tz === 'AoE') return new Date(Date.UTC(y, m - 1, dd, h + 12, mi));
  return new Date(y, m - 1, dd, h, mi);
}
const dueDay = d => d.time ? iso(dueAt(d)) : d.date;
function dueText(d, long){
  if (!d.time) return 'Any time';
  const t = fmtT(dueAt(d));
  if (d.tz !== 'AoE') return t;
  const shift = dueDay(d) !== d.date;
  return long ? `${t} your time (${d.time} AoE on ${fmtD(d.date)})` : `${t}${shift ? ', ' + d.time + ' AoE prev day' : ' (' + d.time + ' AoE)'}`;
}

/* ---------- meetings ---------- */
const mStart = m => m.allDay ? parseD(m.sd).getTime() : +new Date(m.start);
const mEnd = m => m.allDay ? parseD(m.ed).getTime() : Math.max(+new Date(m.end), +new Date(m.start) + 15 * MIN);
function meetingsOn(day){
  const ds = parseD(day).getTime(), de = ds + DAY;
  return state.meetings.filter(m => mStart(m) < de && mEnd(m) > ds);
}
function meetingGroup(m){
  const txt = ((m.desc || '') + ' ' + (m.title || '')).toLowerCase();
  return state.groups.find(g => g.tag && txt.includes('#' + g.tag.toLowerCase()));
}
const mColor = m => { const g = meetingGroup(m); return g ? gcol(g.color) : (m.colorId ? gcol(m.colorId) : (state.settings.calMeta[m.calId]?.color || '#039BE5')); };

/* overlap layout for one day: assigns column and column count to each timed segment */
function layoutDay(day){
  const ds = parseD(day).getTime(), de = ds + DAY;
  const segs = state.meetings.filter(m => !m.allDay).map(m => {
    const s0 = mStart(m), e0 = mEnd(m);
    return { m, s: Math.max(s0, ds), e: Math.min(e0, de), cf: s0 < ds, ct: e0 > de };
  }).filter(x => x.e > x.s).sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s));
  let cluster = [], cols = [], cEnd = -Infinity;
  const finish = () => { cluster.forEach(x => x.n = cols.length); cluster = []; cols = []; };
  segs.forEach(x => {
    if (cluster.length && x.s >= cEnd) finish();
    let ci = cols.findIndex(end => end <= x.s);
    if (ci < 0){ ci = cols.length; cols.push(0); }
    cols[ci] = x.e; x.col = ci; cluster.push(x); cEnd = Math.max(cEnd, x.e);
  });
  if (cluster.length) finish();
  return segs;
}

/* problems worth flagging on a day */
function dayIssues(day){
  const ds = parseD(day).getTime(), de = ds + DAY;
  const timed = meetingsOn(day).filter(m => !m.allDay);
  const out = [];
  for (let i = 0; i < timed.length; i++) for (let j = i + 1; j < timed.length; j++){
    const a = timed[i], b = timed[j];
    const s = Math.max(mStart(a), mStart(b)), e = Math.min(mEnd(a), mEnd(b));
    if (e > s && s >= ds && s < de) out.push({ kind:'overlap', ids:[a.id, b.id], s, e,
      html:`<b>${esc(a.title)}</b> overlaps <b>${esc(b.title)}</b> from ${fmtT(new Date(s))} to ${fmtT(new Date(e))}.` });
  }
  const dls = state.deadlines.filter(d => !d.done && dueDay(d) === day);
  dls.filter(d => d.time).forEach(d => {
    const t = +dueAt(d);
    const m = timed.find(m => mStart(m) <= t && mEnd(m) > t);
    if (m) out.push({ kind:'during', ids:[d.id, m.id], html:`<b>${esc(d.title)}</b> is due at ${fmtT(dueAt(d))}, during <b>${esc(m.title)}</b>. Finish it before ${fmtT(new Date(mStart(m)))}${mStart(m) < ds ? ' the day before' : ''}.` });
  });
  if (dls.length){
    const mins = timed.reduce((a, m) => a + (Math.min(mEnd(m), de) - Math.max(mStart(m), ds)) / MIN, 0);
    if (mins >= 240) out.push({ kind:'busy', ids:[], html:`${plural(Math.round(mins / 60), 'hour')} of meetings on the same day as ${plural(dls.length, 'deadline')}. Plan the work for an earlier day.` });
  }
  return out;
}
function clashIds(days){
  const s = new Set();
  days.forEach(day => dayIssues(day).forEach(i => i.kind === 'overlap' && i.ids.forEach(id => s.add(id))));
  return s;
}

/* =========================================================
   Changes with undo
   ========================================================= */
function snap(){ return JSON.stringify({ groups: state.groups, deadlines: state.deadlines, meetings: state.meetings, groupsUpdated: state.groupsUpdated }); }
function restoreSnap(json){
  const s = JSON.parse(json);
  const byId = arr => Object.fromEntries(arr.map(x => [x.id, JSON.stringify(x)]));
  const curD = byId(state.deadlines), oldD = byId(s.deadlines);
  new Set([...Object.keys(curD), ...Object.keys(oldD)]).forEach(id => { if (curD[id] !== oldD[id]) enqueue({ t:'d', id }); });
  const curM = byId(state.meetings), oldM = byId(s.meetings);
  new Set([...Object.keys(curM), ...Object.keys(oldM)]).forEach(id => {
    if (curM[id] !== oldM[id]){ const m = s.meetings.find(x => x.id === id) || state.meetings.find(x => x.id === id); enqueue({ t:'m', id, cal: m.calId }); }
  });
  if (JSON.stringify(state.groups) !== JSON.stringify(s.groups)) enqueue({ t:'cfg' });
  state.groups = s.groups; state.deadlines = s.deadlines; state.meetings = s.meetings; state.groupsUpdated = Date.now();
}
// run a change, save, re-render, show a toast with undo
function change(fn, msg, opts = {}){
  const before = snap();
  const r = fn();
  if (r === false) return;
  save(); render(); scheduleSync();
  if (msg) toast(msg, opts.noUndo ? null : { label:'Undo', fn: () => { restoreSnap(before); save(); render(); scheduleSync(); } });
  return r;
}
function putDeadline(d){
  d.updated = Date.now();
  const i = state.deadlines.findIndex(x => x.id === d.id);
  if (i < 0) state.deadlines.push(d); else state.deadlines[i] = d;
  enqueue({ t:'d', id: d.id });
}
function delDeadline(id){ state.deadlines = state.deadlines.filter(x => x.id !== id); enqueue({ t:'d', id }); }
function putMeeting(m){
  const i = state.meetings.findIndex(x => x.id === m.id);
  if (i < 0) state.meetings.push(m); else state.meetings[i] = m;
  enqueue({ t:'m', id: m.id, cal: m.calId });
}
function delMeeting(m){ state.meetings = state.meetings.filter(x => x.id !== m.id); enqueue({ t:'m', id: m.id, cal: m.calId }); }
function touchGroups(){ state.groupsUpdated = Date.now(); enqueue({ t:'cfg' }); }

/* =========================================================
   Google Calendar sync
   ========================================================= */
let auth = (() => { try{ return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; }catch(e){ return {}; } })();
let tokenClient = null, gisReady = null, syncing = false, syncTimer = null, syncStatus = 'local', syncErr = '';
const hasToken = () => auth.token && Date.now() < (auth.exp || 0) - MIN;

function loadGIS(){
  if (gisReady) return gisReady;
  gisReady = new Promise((res, rej) => {
    if (window.google?.accounts?.oauth2) return res();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => res(); s.onerror = () => { gisReady = null; rej(new Error('Could not load Google sign-in. Check your connection.')); };
    document.head.appendChild(s);
  });
  return gisReady;
}
async function requestToken(interactive){
  await loadGIS();
  const id = state.settings.clientId.trim();
  if (!id) throw new Error('Add your OAuth client ID first.');
  return new Promise((res, rej) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: id, scope: SCOPE,
      callback: r => {
        if (r.error) return rej(new Error(r.error_description || r.error));
        auth = { token: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
        try{ localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }catch(e){}
        res();
      },
      error_callback: e => rej(new Error(e?.type === 'popup_closed' ? 'Sign-in window was closed.' : e?.type === 'popup_failed_to_open' ? 'Your browser blocked the sign-in window. Allow pop-ups for this site.' : 'Google sign-in failed.'))
    });
    tokenClient.requestAccessToken({ prompt: interactive ? '' : 'none', login_hint: state.settings.email || undefined });
  });
}

class ApiError extends Error { constructor(status, msg){ super(msg); this.status = status; } }
async function gapi(method, path, { body, params } = {}){
  if (!hasToken()) throw new ApiError(401, 'Sign in again');
  const url = new URL(API + path);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v === undefined || v === null) return; [].concat(v).forEach(x => url.searchParams.append(k, x)); });
  let r;
  try{
    r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + auth.token, ...(body ? { 'Content-Type':'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  }catch(e){ throw new ApiError(0, 'offline'); }
  if (r.status === 401){ auth = {}; try{ localStorage.removeItem(AUTH_KEY); }catch(e){} throw new ApiError(401, 'Sign in again'); }
  if (r.status === 204) return null;
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, j?.error?.message || ('Google returned ' + r.status));
  return j;
}
async function listAll(path, params){
  let items = [], pageToken;
  do {
    const j = await gapi('GET', path, { params: { ...params, pageToken, maxResults: 2500 } });
    items = items.concat(j.items || []); pageToken = j.nextPageToken;
  } while (pageToken);
  return items;
}
const encCal = id => '/calendars/' + encodeURIComponent(id);

async function ensureDeadlineCal(){
  const s = state.settings;
  const list = await listAll('/users/me/calendarList', { minAccessRole: 'reader' });
  const meta = {};
  list.forEach(c => meta[c.id] = { name: c.summaryOverride || c.summary, color: c.backgroundColor, role: c.accessRole, primary: !!c.primary });
  const prim = list.find(c => c.primary);
  if (prim){ s.email = prim.id; if (s.calendars.includes('primary')) s.calendars = s.calendars.map(c => c === 'primary' ? prim.id : c); }
  let dc = s.deadlineCalId && list.find(c => c.id === s.deadlineCalId);
  if (!dc) dc = list.find(c => (c.description || '').includes('deadline-tracker') && ['owner','writer'].includes(c.accessRole));
  if (!dc){
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    dc = await gapi('POST', '/calendars', { body: { summary: 'Deadlines', description: 'Created by Deadline Tracker (deadline-tracker). Holds your deadlines and tracker settings. Events here are marked free so they never block your schedule.', timeZone: tz } });
    meta[dc.id] = { name: 'Deadlines', color: '#3F51B5', role: 'owner' };
  }
  s.deadlineCalId = dc.id;
  s.calMeta = meta;
  s.calendars = s.calendars.filter(id => meta[id] && id !== dc.id);
  // the deadline calendar always exists, so an old local "primary" alias can be resolved here
  state.meetings.forEach(m => { if (m.calId === 'local' || m.calId === 'primary') { m.calId = s.email || 'primary'; } });
  state.queue.forEach(q => { if (q.t === 'm' && (q.cal === 'local' || q.cal === 'primary')) q.cal = s.email || 'primary'; });
}

/* ---------- mapping deadlines <-> events ---------- */
function deadlineToEvent(d){
  const g = G(d.groupId);
  const start = {}, end = {};
  if (d.time){ const t = dueAt(d); start.dateTime = t.toISOString(); end.dateTime = new Date(+t + 15 * MIN).toISOString(); }
  else { start.date = d.date; end.date = addDays(d.date, 1); }
  return {
    summary: (d.done ? '✓ ' : '') + `[${g.name}] ${d.title}`,
    description: (d.notes ? d.notes + '\n\n' : '') + `[Deadline Tracker: ${d.type}${d.tz === 'AoE' && d.time ? ', due ' + d.time + ' AoE' : ''}]`,
    start, end, transparency: 'transparent', colorId: String(g.color || 8), status: 'confirmed',
    reminders: { useDefault: false, overrides: d.done ? [] : state.settings.reminders.slice(0, 5).map(m => ({ method:'popup', minutes: m })) },
    extendedProperties: { private: { dt:'1', g: d.groupId || '', ty: d.type, dn: d.done ? '1' : '0', tz: d.tz || 'local', up: String(d.updated || Date.now()) } }
  };
}
function eventToDeadline(ev){
  const p = ev.extendedProperties?.private || {};
  const d = { id: ev.id, groupId: p.g || '', type: p.ty || 'Task', tz: p.tz === 'AoE' ? 'AoE' : 'local', done: p.dn === '1', updated: Number(p.up) || 0 };
  d.title = String(ev.summary || '').replace(/^✓\s*/, '').replace(/^\[[^\]]*\]\s*/, '') || 'Untitled';
  d.notes = String(ev.description || '').replace(FOOTER_RE, '').trim();
  if (ev.start?.date){ d.date = ev.start.date; d.time = ''; }
  else {
    const t = new Date(ev.start.dateTime);
    if (d.tz === 'AoE'){ const a = new Date(+t - 12 * HOUR); d.date = `${a.getUTCFullYear()}-${pad(a.getUTCMonth() + 1)}-${pad(a.getUTCDate())}`; d.time = `${pad(a.getUTCHours())}:${pad(a.getUTCMinutes())}`; }
    else { d.date = iso(t); d.time = fmtT(t); }
  }
  if (!state.groups.some(g => g.id === d.groupId)){
    const m = String(ev.summary || '').match(/^(?:✓\s*)?\[([^\]]+)\]/);
    d.groupId = groupByName(state, m ? m[1] : 'General', true).id;
  }
  return d;
}
function eventToMeeting(ev, calId){
  const role = state.settings.calMeta[calId]?.role;
  const editable = ['owner','writer'].includes(role) && (!ev.organizer || ev.organizer.self || ev.guestsCanModify === true);
  const m = { id: ev.id, calId, title: ev.summary || '(No title)', desc: ev.description || '', colorId: ev.colorId ? Number(ev.colorId) : 0,
    link: ev.htmlLink || '', editable, recurring: !!ev.recurringEventId, attendees: (ev.attendees || []).length,
    meet: ev.hangoutLink || '', location: ev.location || '' };
  if (ev.start?.date){ m.allDay = true; m.sd = ev.start.date; m.ed = ev.end?.date || addDays(ev.start.date, 1); }
  else { m.allDay = false; m.start = ev.start.dateTime; m.end = ev.end?.dateTime || ev.start.dateTime; }
  return m;
}
function meetingToPatch(m){
  const b = { summary: m.title, description: m.desc || '' };
  if (m.allDay){ b.start = { date: m.sd, dateTime: null }; b.end = { date: m.ed, dateTime: null }; }
  else { b.start = { dateTime: new Date(m.start).toISOString(), date: null }; b.end = { dateTime: new Date(m.end).toISOString(), date: null }; }
  return b;
}

/* patch an event, or create it with our own id when it does not exist yet */
async function upsertEvent(calId, id, body){
  try{ return await gapi('PATCH', `${encCal(calId)}/events/${id}`, { body }); }
  catch(e){
    if (e.status !== 404 && e.status !== 410) throw e;
    const clean = JSON.parse(JSON.stringify({ ...body, id }, (k, v) => v === null ? undefined : v));
    try{ return await gapi('POST', `${encCal(calId)}/events`, { body: clean }); }
    catch(e2){ if (e2.status === 409) return gapi('PATCH', `${encCal(calId)}/events/${id}`, { body: { ...body, status:'confirmed' } }); throw e2; }
  }
}
async function deleteEvent(calId, id){
  try{ await gapi('DELETE', `${encCal(calId)}/events/${id}`); }
  catch(e){ if (![404, 410].includes(e.status)) throw e; }
}

/* first connection from a device: combine its groups with the ones already in Google instead of overwriting */
async function firstMerge(){
  const s = state.settings;
  let remote = null;
  try{
    const cfg = await gapi('GET', `${encCal(s.deadlineCalId)}/events/${CONFIG_ID}`);
    if (cfg && cfg.status !== 'cancelled') remote = JSON.parse(cfg.description || 'null');
  }catch(e){ if (e.status !== 404 && e.status !== 410) throw e; }
  if (remote && Array.isArray(remote.groups) && remote.groups.length){
    const byName = Object.fromEntries(remote.groups.map(g => [g.name.toLowerCase(), g]));
    const used = new Set(state.deadlines.map(d => d.groupId));
    const merged = remote.groups.slice(); let added = false;
    state.groups.forEach(g => {
      const r = byName[g.name.toLowerCase()];
      if (r){ state.deadlines.forEach(d => { if (d.groupId === g.id){ d.groupId = r.id; enqueue({ t:'d', id: d.id }); } }); }
      else if (used.has(g.id)){ merged.push(g); added = true; }
    });
    state.groups = merged;
    state.groupsUpdated = Math.max(remote.updated || 0, 1);
    state.queue = state.queue.filter(q => q.t !== 'cfg');
    if (added) touchGroups();
  } else enqueue({ t:'cfg' });
  s.needMerge = false; save();
}

async function flush(){
  const s = state.settings;
  for (const op of state.queue.slice()){
    try{
      if (op.t === 'd'){
        const d = findD(op.id);
        if (d) await upsertEvent(s.deadlineCalId, d.id, deadlineToEvent(d));
        else await deleteEvent(s.deadlineCalId, op.id);
      } else if (op.t === 'm'){
        if (!op.cal || op.cal === 'local') continue;
        const m = findM(op.id);
        if (m){
          if (m.editable || m.mine){
            const ev = await upsertEvent(op.cal, m.id, meetingToPatch(m));
            if (ev?.htmlLink) m.link = ev.htmlLink;
          }
        } else await deleteEvent(op.cal, op.id);
      } else if (op.t === 'cfg'){
        await upsertEvent(s.deadlineCalId, CONFIG_ID, {
          summary: 'Deadline Tracker settings (keep this)', start: { date:'2000-01-01' }, end: { date:'2000-01-02' }, transparency:'transparent',
          description: JSON.stringify({ groups: state.groups, updated: state.groupsUpdated }),
          extendedProperties: { private: { dtcfg:'1' } }, reminders: { useDefault:false, overrides:[] }, status:'confirmed'
        });
      }
      state.queue = state.queue.filter(q => q !== op);
      save();
    }catch(e){
      if (e.status === 0 || e.status === 401 || e.status === 429 || e.status >= 500) throw e;
      // a request Google will never accept: drop it so it does not block everything else
      state.queue = state.queue.filter(q => q !== op); save();
      toast('Google rejected one change: ' + e.message);
    }
  }
}

function wantedRange(){
  const t = todayISO();
  let a = addDays(t, -14), b = addDays(t, 75);
  const v = visibleDays();
  if (v[0] < a) a = v[0];
  if (v[v.length - 1] > b) b = v[v.length - 1];
  return [addDays(a, -1), addDays(b, 2)];
}
async function pull(){
  const s = state.settings;
  // groups
  if (!state.queue.some(q => q.t === 'cfg')){
    try{
      const cfg = await gapi('GET', `${encCal(s.deadlineCalId)}/events/${CONFIG_ID}`);
      const j = cfg && cfg.status !== 'cancelled' ? JSON.parse(cfg.description || '{}') : null;
      if (j && Array.isArray(j.groups) && j.updated > state.groupsUpdated){ state.groups = j.groups; state.groupsUpdated = j.updated; }
      else if (!j || j.updated < state.groupsUpdated) enqueue({ t:'cfg' });
    }catch(e){ if (e.status === 404 || e.status === 410) enqueue({ t:'cfg' }); else throw e; }
  }
  // deadlines
  const evs = await listAll(`${encCal(s.deadlineCalId)}/events`, { privateExtendedProperty: 'dt=1', singleEvents: true, showDeleted: false, timeMin: new Date(Date.now() - 400 * DAY).toISOString() });
  const pd = pendingSet('d');
  const remote = evs.filter(e => e.status !== 'cancelled' && !pd.has(e.id)).map(eventToDeadline);
  state.deadlines = remote.concat(state.deadlines.filter(d => pd.has(d.id)));
  // meetings from the chosen calendars
  const [a, b] = wantedRange();
  const tMin = parseD(a).toISOString(), tMax = parseD(b).toISOString();
  const pm = pendingSet('m');
  let meets = [];
  for (const cal of s.calendars){
    const list = await listAll(`${encCal(cal)}/events`, { singleEvents: true, orderBy: 'startTime', timeMin: tMin, timeMax: tMax, showDeleted: false });
    list.filter(e => e.status !== 'cancelled' && !pm.has(e.id) && !['workingLocation','birthday'].includes(e.eventType) && !(e.extendedProperties?.private?.dt))
      .forEach(e => meets.push(eventToMeeting(e, cal)));
  }
  state.meetings = meets.concat(state.meetings.filter(m => pm.has(m.id)));
  state.meetRange = [a, b];
}

function setSync(st, err){ syncStatus = st; syncErr = err || ''; renderSync(); }
async function sync(opts = {}){
  const s = state.settings;
  if (!s.connected){ setSync('local'); return; }
  if (syncing) return;
  if (!navigator.onLine){ setSync('offline'); return; }
  if (!hasToken()){
    if (opts.interactive){ try{ await requestToken(true); }catch(e){ setSync('reconnect', e.message); return; } }
    else { setSync('reconnect'); return; }
  }
  syncing = true; setSync('syncing');
  try{
    if (!s.deadlineCalId || opts.full) await ensureDeadlineCal();
    if (s.needMerge) await firstMerge();
    await flush();
    await pull();
    if (state.queue.length) await flush();
    state.lastSync = Date.now(); save(); render();
    setSync(state.queue.length ? 'offline' : 'ok');
  }catch(e){
    if (e.status === 401) setSync('reconnect');
    else if (e.status === 0) setSync('offline');
    else setSync('error', e.message);
    save(); render();
  }finally{ syncing = false; }
}
function scheduleSync(delay = 900){
  if (!state.settings.connected) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => sync(), delay);
}

async function connectGoogle(){
  const s = state.settings;
  s.clientId = $('#clientId').value.trim();
  $('#gErr').textContent = '';
  if (!/\.apps\.googleusercontent\.com$/.test(s.clientId)){ $('#gErr').textContent = 'That does not look like a client ID. It ends with .apps.googleusercontent.com.'; return; }
  save();
  try{
    await requestToken(true);
    s.connected = true; s.needMerge = true;
    // everything already on this device goes up to Google once
    state.deadlines.forEach(d => enqueue({ t:'d', id: d.id }));
    state.meetings.forEach(m => { if (m.calId === 'local') { m.calId = 'primary'; m.mine = true; m.editable = true; enqueue({ t:'m', id: m.id, cal:'primary' }); } });
    save();
    await sync({ full: true });
    renderSettings();
    if (syncStatus === 'ok' || syncStatus === 'offline') toast('Connected. Your deadlines are now in the "Deadlines" calendar in Google.');
  }catch(e){ $('#gErr').textContent = e.message; s.connected = false; save(); renderSettings(); }
}
function disconnectGoogle(){
  if (!confirm('Disconnect Google Calendar? Your deadlines stay in Google and on this device, but stop syncing.')) return;
  try{ if (auth.token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(auth.token, () => {}); }catch(e){}
  auth = {}; try{ localStorage.removeItem(AUTH_KEY); }catch(e){}
  const s = state.settings;
  s.connected = false;
  state.meetings = state.meetings.filter(m => m.calId === 'local');
  save(); render(); renderSettings(); setSync('local');
}

/* =========================================================
   View state
   ========================================================= */
let view = (localStorage.getItem('dt3-view') || (innerWidth < 860 ? 'day' : 'month'));
let anchor = todayISO();       // date the current view is built around
let selected = todayISO();
let tab = 'day';
let freshId = null;
const openGroups = new Set();
let idleOpen = false, scrolledFor = '';

function visibleDays(){
  if (view === 'day') return [anchor];
  if (view === 'week'){ const s = weekStart(anchor); return [...Array(7)].map((_, i) => addDays(s, i)); }
  const first = anchor.slice(0, 8) + '01';
  const s = weekStart(first);
  return [...Array(42)].map((_, i) => addDays(s, i));
}

/* =========================================================
   Rendering
   ========================================================= */
function render(){
  renderTitle();
  renderCalendar();
  renderPanel();
  renderHero();
  $('#groupList').innerHTML = state.groups.map(g => `<option value="${esc(g.name)}">`).join('');
  $$('#viewSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
  $$('.side .tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  const open = state.deadlines.filter(d => !d.done);
  const od = open.filter(d => +dueAt(d) < Date.now()).length;
  const td = open.filter(d => dueDay(d) === todayISO()).length;
  document.title = (od ? `(${od} overdue) ` : td ? `(${td} today) ` : '') + 'Deadlines';
  const up = $('.side .tabs [data-tab=upcoming]');
  up.innerHTML = 'Upcoming' + (open.length ? `<span class="cnt">${open.length}</span>` : '');
}

function renderTitle(){
  const d = parseD(anchor);
  let html;
  if (view === 'month') html = `${d.toLocaleDateString('en-GB', { month:'long' })} <span>${d.getFullYear()}</span>`;
  else if (view === 'week'){
    const v = visibleDays(), a = parseD(v[0]), b = parseD(v[6]);
    const same = a.getMonth() === b.getMonth();
    html = same ? `${a.getDate()} to ${b.getDate()} ${b.toLocaleDateString('en-GB', { month:'long' })} <span>${b.getFullYear()}</span>`
      : `${a.toLocaleDateString('en-GB', { day:'numeric', month:'short' })} to ${b.toLocaleDateString('en-GB', { day:'numeric', month:'short' })} <span>${b.getFullYear()}</span>`;
  } else html = `${d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })} <span>${d.getFullYear()}</span>`;
  $('#rangeTitle').innerHTML = html;
}

function renderCalendar(){
  const el = $('#calwrap');
  if (view === 'month') el.innerHTML = monthHTML();
  else el.innerHTML = timelineHTML();
  if (view !== 'month'){
    const sc = $('.tl-scroll', el);
    const key = view + anchor;
    if (scrolledFor !== key){
      const now = new Date();
      const h = visibleDays().includes(todayISO()) ? Math.max(0, now.getHours() - 2) : 7.5;
      const px = h * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour'));
      sc.scrollTop = px; requestAnimationFrame(() => { sc.scrollTop = px; });
      scrolledFor = key;
    } else if (window.__keepScroll != null) sc.scrollTop = window.__keepScroll;
  }
}

/* ---------- month ---------- */
function chipD(d){
  const g = G(d.groupId);
  return `<button class="chip dl${d.done ? ' done' : ''}${d.id === freshId ? ' fresh' : ''}" draggable="true" data-d="${d.id}" style="--c:${gcol(g.color)}" title="${esc(g.name + ': ' + d.title + (d.time ? ', due ' + dueText(d) : ''))}"><span>${d.time ? `<span class="t">${fmtT(dueAt(d))}</span> ` : ''}${esc(d.title)}</span></button>`;
}
function chipM(m, day, clash){
  const st = new Date(mStart(m));
  const cont = !m.allDay && iso(st) !== day;
  const can = m.editable || m.mine;
  return `<button class="chip mt${m.allDay ? ' allday' : ''}${clash ? ' clash' : ''}${m.id === freshId ? ' fresh' : ''}" ${can ? 'draggable="true"' : ''} data-m="${esc(m.id)}" style="--c:${mColor(m)}" title="${esc(m.title)}"><span>${m.allDay ? '' : `<span class="t">${cont ? 'cont.' : fmtT(st)}</span> `}${esc(m.title)}</span></button>`;
}
function monthHTML(){
  const days = visibleDays(), t = todayISO(), mo = parseD(anchor).getMonth();
  const clashes = clashIds(days);
  const byDay = {};
  state.deadlines.forEach(d => (byDay[dueDay(d)] = byDay[dueDay(d)] || []).push(d));
  let h = `<div class="wdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x => `<div>${x}</div>`).join('')}</div><div class="month" id="month">`;
  days.forEach(day => {
    const d = parseD(day);
    const dls = (byDay[day] || []).sort((a, b) => (a.done - b.done) || (+dueAt(a) - +dueAt(b)));
    const ms = meetingsOn(day).sort((a, b) => (b.allDay - a.allDay) || mStart(a) - mStart(b));
    const issues = dayIssues(day);
    const hot = issues.filter(i => i.kind !== 'busy').length;
    const items = dls.map(chipD).concat(ms.map(m => chipM(m, day, clashes.has(m.id))));
    const max = 4;
    const cls = ['cell', d.getMonth() !== mo && 'other', day === t && 'today', day === selected && 'sel', (d.getDay() % 6 === 0) && 'wknd'].filter(Boolean).join(' ');
    h += `<div class="${cls}" data-date="${day}" tabindex="0" role="button" aria-label="${fmtD(day, { weekday:'long', day:'numeric', month:'long' })}, ${plural(dls.length, 'deadline')}, ${plural(ms.length, 'meeting')}${issues.length ? ', has warnings' : ''}">
      <div class="top-row"><span class="dn">${d.getDate()}</span>${issues.length ? `<span class="flagdot${hot ? '' : ' warm'}" title="${esc(issues.map(i => i.html.replace(/<[^>]+>/g, '')).join('\n'))}">${ic('alert')}${issues.length > 1 ? issues.length : ''}</span>` : ''}</div>
      ${items.slice(0, items.length > max ? max - 1 : max).join('')}
      ${items.length > max ? `<button class="more" data-more="${day}">+${items.length - max + 1} more</button>` : ''}
    </div>`;
  });
  return h + '</div>';
}

/* ---------- week / day timeline ---------- */
function timelineHTML(){
  const days = visibleDays(), t = todayISO();
  const clashes = clashIds(days);
  const hourPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')) || 48;
  let head = '<div class="tl-row tl-head" style="--cols:' + days.length + '"><div></div>';
  let due = '<div class="tl-row tl-due" style="--cols:' + days.length + '"><div class="lab">Due</div>';
  let body = '<div class="tl-row tl-body" style="--cols:' + days.length + '"><div class="tl-gut">' +
    [...Array(24)].map((_, i) => i ? `<span style="top:${i * hourPx}px">${pad(i)}:00</span>` : '').join('') + '</div>';
  days.forEach(day => {
    const d = parseD(day);
    head += `<div class="hd${day === t ? ' today' : ''}${day === selected ? ' sel' : ''}" data-date="${day}"><span>${d.toLocaleDateString('en-GB', { weekday:'short' })}</span><b>${d.getDate()}</b></div>`;
    const dls = state.deadlines.filter(x => dueDay(x) === day).sort((a, b) => +dueAt(a) - +dueAt(b));
    const allday = meetingsOn(day).filter(m => m.allDay);
    due += `<div class="col" data-date="${day}">${dls.map(chipD).join('')}${allday.map(m => chipM(m, day, false)).join('')}</div>`;
    const ds = parseD(day).getTime();
    let col = `<div class="tl-col${day === t ? ' today' : ''}" data-date="${day}">`;
    layoutDay(day).forEach(x => {
      const top = (x.s - ds) / HOUR * hourPx, ht = Math.max(20, (x.e - x.s) / HOUR * hourPx - 2);
      const w = 100 / x.n, left = x.col * w;
      const m = x.m, cl = clashes.has(m.id);
      const s0 = new Date(mStart(m)), e0 = new Date(mEnd(m));
      const tm = `${fmtT(s0)} to ${fmtT(e0)}`;
      const badges = [cl && `<span class="badge hot">${ic('alert')}Overlap</span>`, x.cf && `<span class="badge mute">from ${s0.toLocaleDateString('en-GB', { weekday:'short' })}</span>`, x.ct && `<span class="badge mute">continues ${e0.toLocaleDateString('en-GB', { weekday:'short' })}</span>`].filter(Boolean).join(' ');
      col += `<div class="blk${x.cf ? ' cf' : ''}${x.ct ? ' ct' : ''}${cl ? ' clash' : ''}${m.id === freshId ? ' fresh' : ''}" data-m="${esc(m.id)}" style="--c:${mColor(m)};top:${top}px;height:${ht}px;left:calc(${left}% + 3px);width:calc(${w}% - 6px)" title="${esc(m.title + ', ' + tm)}">
        <b>${esc(m.title)}</b>${ht > 34 ? `<span class="tm">${tm}</span>` : ''}${ht > 52 && badges ? `<div>${badges}</div>` : ''}</div>`;
    });
    dls.filter(x => x.time && !x.done).forEach(x => {
      const at = +dueAt(x), top = (at - ds) / HOUR * hourPx;
      const inside = meetingsOn(day).some(m => !m.allDay && mStart(m) <= at && mEnd(m) > at);
      col += `<div class="dline" style="--c:${inside ? 'var(--hot)' : gcol(G(x.groupId).color)};top:${top}px"></div>
        <div class="dflag${inside ? ' in' : ''}" data-d="${x.id}" style="--c:${gcol(G(x.groupId).color)};top:${top}px">${inside ? 'During a meeting: ' : 'Due '}${esc(x.title)} ${fmtT(dueAt(x))}</div>`;
    });
    if (day === t){ const n = new Date(); col += `<div class="now" style="top:${(n.getHours() + n.getMinutes() / 60) * hourPx}px"></div>`; }
    body += col + '</div>';
  });
  return `<div class="tl">${head}</div>${due}</div><div class="tl-scroll">${body}</div></div></div>`;
}

/* ---------- side panel ---------- */
function rowHTML(d){
  const g = G(d.groupId), at = dueAt(d);
  const dd = diffDays(dueDay(d), todayISO());
  const late = !d.done && +at < Date.now();
  let n, u;
  if (d.done){ n = ic('check'); u = 'done'; }
  else if (late){ const h = Math.floor((Date.now() - at) / HOUR); n = h < 24 ? h + 'h' : String(Math.floor(h / 24)); u = 'late'; }
  else if (dd === 0){ const h = Math.max(0, Math.floor((at - Date.now()) / HOUR)); n = d.time ? h + 'h' : '0'; u = d.time ? 'left' : 'today'; }
  else { n = String(dd); u = dd === 1 ? 'day' : 'days'; }
  const heat = d.done ? '' : (late || dd <= 2) ? ' hot' : dd <= 7 ? ' warm' : '';
  return `<li class="row${heat}${d.done ? ' done' : ''}" data-d="${d.id}">
    <button class="check" data-act="toggle" aria-label="${d.done ? 'Mark not done' : 'Mark done'}">${ic('check')}</button>
    <div class="count"><span class="n">${n}</span><span class="u">${u}</span></div>
    <button class="body" data-act="edit">
      <span class="title">${esc(d.title)}</span>
      <span class="meta"><span class="gname" style="--c:${gcol(g.color)}">${esc(g.name)}</span><span>${esc(d.type)}</span><span>${fmtD(dueDay(d))}${d.time ? ', ' + dueText(d) : ''}</span></span>
      ${d.notes ? `<span class="notes">${esc(d.notes)}</span>` : ''}
    </button></li>`;
}
function mrowHTML(m, day, clash){
  const s = new Date(mStart(m)), e = new Date(mEnd(m));
  const cal = state.settings.calMeta[m.calId]?.name || (m.calId === 'local' ? 'This device' : '');
  const g = meetingGroup(m);
  const tm = m.allDay ? `All day<small>${diffDays(m.ed, m.sd) > 1 ? 'until ' + fmtD(addDays(m.ed, -1)) : ''}</small>`
    : `${fmtT(s)}<small>to ${fmtT(e)}${iso(e) !== iso(s) ? ' ' + e.toLocaleDateString('en-GB', { weekday:'short' }) : ''}</small>`;
  return `<button class="mrow" data-m="${esc(m.id)}" style="--c:${mColor(m)}"><span class="tm">${tm}</span>
    <span><span class="mt">${esc(m.title)}</span>
    <span class="sub">${[cal, g && g.name, m.attendees > 1 && plural(m.attendees, 'guest'), m.location].filter(Boolean).map(esc).join(', ')}</span>
    ${clash || (!m.allDay && iso(s) !== day) || (!m.allDay && iso(new Date(+e - 1)) !== iso(s)) ? `<span>${clash ? `<span class="badge hot">${ic('alert')}Overlap</span> ` : ''}${!m.allDay && iso(s) !== day ? `<span class="badge mute">from ${fmtD(iso(s))}</span> ` : ''}${!m.allDay && iso(s) === day && iso(new Date(+e - 1)) !== day ? `<span class="badge mute">ends ${fmtD(iso(e))}</span>` : ''}</span>` : ''}</span></button>`;
}
function renderPanel(){
  const p = $('#panel');
  if (tab === 'day') p.innerHTML = dayPanelHTML();
  else if (tab === 'upcoming') p.innerHTML = upcomingHTML();
  else p.innerHTML = groupsHTML();
}
function dayPanelHTML(){
  const day = selected, t = todayISO();
  const dls = state.deadlines.filter(d => dueDay(d) === day).sort((a, b) => (a.done - b.done) || (+dueAt(a) - +dueAt(b)));
  const ms = meetingsOn(day).sort((a, b) => (b.allDay - a.allDay) || mStart(a) - mStart(b));
  const issues = dayIssues(day);
  const clash = new Set(issues.filter(i => i.kind === 'overlap').flatMap(i => i.ids));
  let h = `<div class="dayhead"><h2>${fmtD(day, { weekday:'long', day:'numeric', month:'long' })}</h2><span class="rel">${relDay(diffDays(day, t))}</span></div>`;
  h += issues.map(i => `<div class="issue${i.kind === 'busy' ? ' warm' : ''}">${ic('alert')}<span>${i.html}</span></div>`).join('');
  h += `<h3 class="sec">${ic('flag')}Due</h3>` + (dls.length ? `<ul class="list">${dls.map(rowHTML).join('')}</ul>` : `<div class="empty">Nothing due.</div>`);
  h += `<h3 class="sec">${ic('users')}Meetings</h3>` + (ms.length ? ms.map(m => mrowHTML(m, day, clash.has(m.id))).join('') : `<div class="empty">${state.settings.connected ? 'No meetings.' : 'No meetings. Connect Google Calendar in Settings to see your real ones.'}</div>`);
  h += `<div class="rowbtns"><button class="btn small" data-act="addD">${ic('plus')}Deadline</button><button class="btn small" data-act="addM">${ic('plus')}Meeting</button></div>`;
  if (day === t){
    const od = state.deadlines.filter(d => !d.done && +dueAt(d) < Date.now() && dueDay(d) !== t).sort((a, b) => +dueAt(a) - +dueAt(b));
    if (od.length) h += `<h3 class="sec hot">${ic('alert')}Overdue</h3><ul class="list">${od.map(rowHTML).join('')}</ul>`;
  }
  const next = state.deadlines.filter(d => !d.done && dueDay(d) > day).sort((a, b) => +dueAt(a) - +dueAt(b)).slice(0, 5);
  if (next.length) h += `<h3 class="sec">${ic('clock')}Coming next</h3><ul class="list">${next.map(rowHTML).join('')}</ul>`;
  return h;
}
function upcomingHTML(){
  const list = state.deadlines.filter(d => !d.done).sort((a, b) => +dueAt(a) - +dueAt(b));
  if (!list.length) return `<div class="empty">No open deadlines. Press N to add one.</div>`;
  const now = Date.now(), t = todayISO();
  const bands = [['Overdue', d => +dueAt(d) < now, 'hot'], ['Today', d => +dueAt(d) >= now && dueDay(d) === t, 'hot'],
    ['Next 7 days', d => diffDays(dueDay(d), t) > 0 && diffDays(dueDay(d), t) <= 7, ''], ['Next 30 days', d => diffDays(dueDay(d), t) > 7 && diffDays(dueDay(d), t) <= 30, ''],
    ['Later', d => diffDays(dueDay(d), t) > 30, '']];
  return bands.map(([n, fn, c]) => { const g = list.filter(fn); return g.length ? `<h3 class="sec ${c}">${n}<span class="kbd">${g.length}</span></h3><ul class="list">${g.map(rowHTML).join('')}</ul>` : ''; }).join('');
}
function groupsHTML(){
  const active = [], idle = [];
  state.groups.forEach(g => {
    const its = state.deadlines.filter(d => d.groupId === g.id).sort((a, b) => +dueAt(a) - +dueAt(b));
    const meets = state.meetings.filter(m => meetingGroup(m) === g && mEnd(m) > Date.now() - 7 * DAY);
    const next = its.find(d => !d.done);
    (its.length || meets.length ? active : idle).push({ g, its, meets, next });
  });
  active.sort((a, b) => (a.next ? +dueAt(a.next) : Infinity) - (b.next ? +dueAt(b.next) : Infinity));
  let h = active.length ? '' : `<div class="empty">No group has dates yet. Pick one below, or create a group for your next conference.</div>`;
  h += active.map(({ g, its, meets, next }) => {
    const done = its.filter(d => d.done).length, pct = its.length ? Math.round(done / its.length * 100) : 0;
    let nx = `<div class="next">${its.length ? 'All steps done.' : 'Only meetings so far.'}</div>`;
    if (next){
      const dd = diffDays(dueDay(next), todayISO()), late = +dueAt(next) < Date.now();
      const rel = late ? 'overdue' : dd === 0 ? 'today' : dd === 1 ? 'tomorrow' : `in ${dd} days`;
      nx = `<div class="next${late || dd <= 2 ? ' hot' : ''}">Next: <b>${esc(next.title)}</b> <span class="d">${rel}, ${fmtD(dueDay(next))}</span></div>`;
    }
    const open = openGroups.has(g.id);
    const steps = its.map(d => ({ k:'d', at: +dueAt(d), d })).concat(meets.map(m => ({ k:'m', at: mStart(m), m }))).sort((a, b) => a.at - b.at);
    return `<div class="group" style="--c:${gcol(g.color)}" data-gid="${g.id}">
      <div class="ghead"><h4>${esc(g.name)}</h4><span class="kind">${esc(g.kind)}, ${done} of ${its.length} done</span></div>
      <div class="progress"><i style="width:${pct}%"></i></div>${nx}
      ${open ? `<div class="steps">${steps.map(s => {
        if (s.k === 'm') return `<div class="step"><span class="pip meet"></span><button data-m="${esc(s.m.id)}"><span class="st">${esc(s.m.title)}</span></button><span class="when">${new Date(s.at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}, ${s.m.allDay ? 'all day' : fmtT(new Date(s.at))}</span></div>`;
        const d = s.d, dd = diffDays(dueDay(d), todayISO());
        const rel = d.done ? 'done' : +dueAt(d) < Date.now() ? 'late' : dd === 0 ? 'today' : `in ${dd}d`;
        return `<div class="step${d.done ? ' done' : ''}${next && d.id === next.id ? ' isnext' : ''}"><span class="pip"></span><button data-d="${d.id}"><span class="st">${esc(d.title)}</span></button><span class="when">${fmtD(dueDay(d), { day:'numeric', month:'short' })}, ${rel}</span></div>`;
      }).join('')}</div>` : ''}
      <div class="gfoot">
        <button class="link" data-gact="toggle">${open ? 'Hide steps' : `Show steps (${steps.length})`}</button>
        <button class="link" data-gact="add">Add step</button>
        <button class="link" data-gact="edit">Edit</button>
        <button class="link danger" data-gact="delete">Delete</button>
      </div></div>`;
  }).join('');
  if (idle.length) h += `<details class="idle"${idleOpen || !active.length ? ' open' : ''}><summary>No dates yet (${idle.length})</summary>${idle.map(({ g }) =>
    `<div class="group idle-card" style="--c:${gcol(g.color)}" data-gid="${g.id}"><div class="ghead"><h4>${esc(g.name)}</h4><span class="kind">${esc(g.kind)}</span></div>
     <div class="gfoot"><button class="link" data-gact="edit">Add dates</button><button class="link danger" data-gact="delete">Delete</button></div></div>`).join('')}</details>`;
  return h + `<div class="rowbtns"><button class="btn small" data-act="newGroup">${ic('plus')}New group</button></div>`;
}

/* ---------- hero countdown ---------- */
function nextDeadline(){
  const now = Date.now();
  return state.deadlines.filter(d => !d.done && +dueAt(d) > now).sort((a, b) => +dueAt(a) - +dueAt(b))[0];
}
let heroId = null;
function renderHero(){
  const d = nextDeadline(), el = $('#hero');
  if (!d){ heroId = null; el.innerHTML = `<button class="hero-btn" data-act="addD"><span class="hero-txt"><span class="hero-k">Next deadline</span><span class="hero-t">Nothing coming up. Add your next one.</span></span><span class="clock">${ic('plus')}</span></button>`; return; }
  const g = G(d.groupId);
  if (heroId !== d.id){
    heroId = d.id;
    el.innerHTML = `<button class="hero-btn" data-d="${d.id}" title="Open"><span class="hero-txt"><span class="hero-k">Next deadline, ${esc(g.name)}</span><span class="hero-t">${esc(d.title)}</span></span><span class="clock" id="clock"></span></button>`;
  }
  tickHero();
}
function tickHero(){
  const d = heroId && findD(heroId), c = $('#clock');
  if (!d || !c) return;
  let ms = +dueAt(d) - Date.now();
  if (ms <= 0){ renderHero(); return; }
  const dd = Math.floor(ms / DAY); ms -= dd * DAY;
  const hh = Math.floor(ms / HOUR); ms -= hh * HOUR;
  const mm = Math.floor(ms / MIN); const ss = Math.floor((ms - mm * MIN) / 1000);
  c.className = 'clock' + (dd < 2 ? ' hot' : dd < 7 ? ' warm' : '');
  c.innerHTML = (dd ? `${dd}<small>d</small>` : '') + `${pad(hh)}<small>h</small>${pad(mm)}<small>m</small>${dd ? '' : pad(ss) + '<small>s</small>'}`;
}

/* ---------- sync pill ---------- */
function renderSync(){
  const p = $('#syncPill'), q = state.queue.length;
  p.dataset.s = syncStatus;
  const ago = state.lastSync ? Math.round((Date.now() - state.lastSync) / MIN) : null;
  const L = { local:'On this device', syncing:'Syncing', ok: ago === null ? 'Synced' : ago < 1 ? 'Synced just now' : `Synced ${ago} min ago`,
    offline: `Offline${q ? ', ' + q + ' waiting' : ''}`, reconnect:'Sign in again', error:'Sync problem' };
  $('#syncLbl').textContent = L[syncStatus] || '';
  p.title = syncStatus === 'error' ? syncErr : syncStatus === 'reconnect' ? 'Google needs you to sign in again. Click to sign in.' : syncStatus === 'local' ? 'Saved on this device only. Click to connect Google Calendar.' : 'Click to sync now';
}

/* =========================================================
   Entry dialog (deadline or meeting)
   ========================================================= */
const ef = () => $('#entryForm');
let editD = null, editM = null, entryKind = 'deadline';
function setKind(k){
  entryKind = k;
  $$('#kindSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.kind === k));
  $$('#entryForm [data-for]').forEach(el => el.hidden = el.dataset.for !== k);
  updateHints();
}
function fillCalSelect(cur){
  const s = state.settings, sel = ef().cal;
  if (!s.connected){ sel.innerHTML = `<option value="local">This device (connect Google to sync)</option>`; return; }
  const w = Object.entries(s.calMeta).filter(([id, c]) => ['owner','writer'].includes(c.role) && id !== s.deadlineCalId);
  sel.innerHTML = w.map(([id, c]) => `<option value="${esc(id)}">${esc(c.name)}${c.primary ? ' (main)' : ''}</option>`).join('');
  sel.value = cur && w.some(([id]) => id === cur) ? cur : (s.email || (w[0] && w[0][0]) || '');
}
function openEntry({ d, m, kind, preset = {} } = {}){
  editD = d || null; editM = m || null;
  const f = ef();
  $('#entryErr').textContent = '';
  f.reset();
  f.type.innerHTML = TYPES.map(t => `<option>${t}</option>`).join('');
  f.mgroup.innerHTML = `<option value="">None</option>` + state.groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
  const k = d ? 'deadline' : m ? 'meeting' : (kind || 'deadline');
  $('#kindSeg').hidden = !!(d || m);
  if (d){
    f.title.value = d.title; f.group.value = G(d.groupId).name; f.type.value = d.type; f.date.value = d.date; f.time.value = d.time;
    f.tz.value = d.tz || 'local'; f.notes.value = d.notes || ''; f.done.checked = !!d.done;
  } else if (m){
    f.title.value = m.title; fillCalSelect(m.calId); f.cal.disabled = true;
    f.allDay.checked = !!m.allDay;
    if (m.allDay){ f.sdate.value = m.sd; f.edate.value = addDays(m.ed, -1); }
    else { const s = new Date(m.start), e = new Date(m.end); f.sdate.value = iso(s); f.stime.value = fmtT(s); f.edate.value = iso(e); f.etime.value = fmtT(e); }
    f.notes.value = (m.desc || '').replace(/(^|\s)#[A-Za-z0-9]+/g, (x) => state.groups.some(g => g.tag && x.trim().toLowerCase() === '#' + g.tag.toLowerCase()) ? '' : x).trim();
    const g = meetingGroup(m); f.mgroup.value = g ? g.id : '';
  } else {
    const date = preset.date || selected;
    f.group.value = preset.group || ''; f.type.value = preset.type || 'Task'; f.date.value = date; f.time.value = preset.time || '';
    f.tz.value = preset.tz || state.settings.defaultTz; f.title.value = preset.title || ''; f.notes.value = preset.notes || '';
    fillCalSelect(); f.cal.disabled = false;
    f.sdate.value = date; f.edate.value = date;
    const st = preset.stime || (date === todayISO() ? pad(Math.min(22, new Date().getHours() + 1)) + ':00' : '10:00');
    f.stime.value = st; f.etime.value = pad((+st.slice(0, 2) + 1) % 24) + st.slice(2);
    if (+st.slice(0, 2) === 23) f.edate.value = addDays(date, 1);
    if (preset.mgroup) f.mgroup.value = preset.mgroup;
  }
  const ro = m && !(m.editable || m.mine);
  $$('#entryForm input, #entryForm select, #entryForm textarea').forEach(x => { if (x.name !== 'cal') x.disabled = !!ro; });
  $('#entryDel').style.display = (d || (m && !ro)) ? '' : 'none';
  $('#entryDup').style.display = d ? '' : 'none';
  $('#doneWrap').style.display = d ? '' : 'none';
  const link = m?.link;
  $('#entryOpen').style.display = link ? '' : 'none'; if (link) $('#entryOpen').href = link;
  $('#entryForm [type=submit]').style.display = ro ? 'none' : '';
  if (ro) $('#entryErr').textContent = 'You can view this meeting but only its organizer can change it. Open it in Google to respond.';
  setKind(k); toggleTimed();
  $('#entryDlg').showModal();
  if (!ro) setTimeout(() => (f.title.value ? null : f.title.focus()), 30);
}
function toggleTimed(){ const all = ef().allDay.checked; $$('#entryForm [data-timed]').forEach(x => x.style.visibility = all ? 'hidden' : ''); updateHints(); }
function updateHints(){
  const f = ef();
  if (entryKind === 'deadline'){
    let h = '';
    if (f.date.value && f.time.value && f.tz.value === 'AoE'){
      const d = { date: f.date.value, time: f.time.value, tz: 'AoE' };
      const at = dueAt(d);
      h = `In your time: <b>${at.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'short' })} at ${fmtT(at)}</b>${dueDay(d) !== d.date ? '. That is the next day for you.' : '.'}`;
    } else if (f.date.value && !f.time.value) h = 'No due time: it counts as due by the end of the day.';
    $('#dueHint').innerHTML = h; $('#dueHint').className = 'hint accent';
  } else {
    let h = '';
    if (!f.allDay.checked && f.sdate.value && f.stime.value && f.edate.value && f.etime.value){
      const s = new Date(f.sdate.value + 'T' + f.stime.value), e = new Date(f.edate.value + 'T' + f.etime.value);
      const mins = (e - s) / MIN;
      if (mins <= 0) h = '<span style="color:var(--hot)">The end is before the start.</span>';
      else { const hh = Math.floor(mins / 60), mm = mins % 60; h = `Lasts ${hh ? plural(hh, 'hour') : ''}${hh && mm ? ' ' : ''}${mm ? mm + ' min' : ''}${f.edate.value !== f.sdate.value ? `, ends ${fmtD(f.edate.value)}` : ''}.`; }
    }
    $('#meetHint').innerHTML = h;
  }
}
function entrySubmit(e){
  e.preventDefault();
  const f = ef(), err = $('#entryErr');
  const title = f.title.value.trim();
  if (!title){ err.textContent = 'Add a title first.'; f.title.focus(); return; }
  if (entryKind === 'deadline'){
    if (!f.date.value){ err.textContent = 'Pick a date.'; f.date.focus(); return; }
    const wasNew = !editD;
    change(() => {
      const g = groupByName(state, f.group.value || 'General', true);
      const d = Object.assign(editD ? { ...editD } : { id: genId(), done:false }, {
        title, groupId: g.id, type: f.type.value, date: f.date.value, time: f.time.value, tz: f.time.value ? f.tz.value : 'local',
        notes: f.notes.value.trim(), done: editD ? f.done.checked : false });
      putDeadline(d); freshId = d.id;
      selected = dueDay(d); jumpTo(selected, true);
    }, wasNew ? 'Deadline added.' : 'Saved.');
  } else {
    const all = f.allDay.checked;
    if (!f.sdate.value || !f.edate.value){ err.textContent = 'Pick the start and end dates.'; return; }
    let start, end;
    if (all){ if (f.edate.value < f.sdate.value){ err.textContent = 'The end is before the start.'; return; } }
    else {
      if (!f.stime.value || !f.etime.value){ err.textContent = 'Add start and end times, or tick All day.'; return; }
      start = new Date(f.sdate.value + 'T' + f.stime.value); end = new Date(f.edate.value + 'T' + f.etime.value);
      if (end <= start){ err.textContent = 'The end is before the start. For a meeting past midnight, set the end date to the next day.'; return; }
    }
    const gsel = state.groups.find(g => g.id === f.mgroup.value);
    let desc = f.notes.value.trim();
    if (gsel){ if (!gsel.tag){ gsel.tag = slug(gsel.name); touchGroups(); } desc = (desc ? desc + '\n\n' : '') + '#' + gsel.tag; }
    const wasNew = !editM;
    change(() => {
      const m = editM ? { ...editM } : { id: genId(), calId: f.cal.value || 'local', mine: true, editable: true, attendees: 0, link:'' };
      Object.assign(m, { title, desc, allDay: all });
      if (all){ m.sd = f.sdate.value; m.ed = addDays(f.edate.value, 1); delete m.start; delete m.end; }
      else { m.start = start.toISOString(); m.end = end.toISOString(); delete m.sd; delete m.ed; }
      putMeeting(m); freshId = m.id;
      selected = all ? m.sd : iso(start); jumpTo(selected, true);
    }, wasNew ? (state.settings.connected ? 'Meeting added to Google Calendar.' : 'Meeting added on this device.') : 'Saved.');
  }
  $('#entryDlg').close();
}

/* =========================================================
   Group dialog
   ========================================================= */
let editG = null;
function stageRow(o = {}){
  const div = document.createElement('div');
  div.className = 'stagerow' + (o.done ? ' is-done' : '');
  div.innerHTML = `<input data-k="title" value="${esc(o.title || '')}" placeholder="Step name" aria-label="Step name">
    <input type="date" data-k="date" value="${esc(o.date || '')}" aria-label="Date">
    <input type="time" data-k="time" value="${esc(o.time || '')}" aria-label="Time">
    <input type="checkbox" data-k="done"${o.done ? ' checked' : ''} aria-label="Done">
    <button type="button" class="x" aria-label="Remove step">${ic('x')}</button>`;
  div.dataset.type = o.type || 'Task'; div.dataset.tz = o.tz || state.settings.defaultTz;
  if (o.id) div.dataset.id = o.id;
  div.querySelector('.x').onclick = () => div.remove();
  div.querySelector('[data-k=done]').onchange = ev => div.classList.toggle('is-done', ev.target.checked);
  return div;
}
function fillStages(kind){ const r = $('#stageRows'); r.innerHTML = ''; (TEMPLATES[kind] || TEMPLATES.Other).forEach(([type, title]) => r.appendChild(stageRow({ type, title }))); }
function openGroup(g){
  editG = g || null;
  const f = $('#groupForm');
  f.reset(); $('#groupErr').textContent = '';
  $('#groupTitle').textContent = g ? 'Edit group' : 'New group';
  $('#groupDel').style.display = g ? '' : 'none';
  f.name.value = g?.name || ''; f.kind.value = g?.kind || 'Conference'; f.tag.value = g?.tag || '';
  const color = g?.color || ORDER[state.groups.length % ORDER.length];
  $('#swatches').innerHTML = Object.keys(GCOLORS).map(c => `<label title="${GNAMES[c]}"><input type="radio" name="color" value="${c}"${+c === +color ? ' checked' : ''} aria-label="${GNAMES[c]}"><span style="--c:${GCOLORS[c]}"></span></label>`).join('');
  const r = $('#stageRows'); r.innerHTML = '';
  const its = g ? state.deadlines.filter(d => d.groupId === g.id).sort((a, b) => +dueAt(a) - +dueAt(b)) : [];
  if (its.length) its.forEach(d => r.appendChild(stageRow(d)));
  else fillStages(f.kind.value);
  $('#stageHint').textContent = its.length ? 'Edit any step here. The × removes a step. Times use each step\'s own time zone.' : 'Fill in the dates you know and leave the rest empty. Steps without a date are skipped.';
  updateTagEx();
  $('#groupDlg').showModal(); if (!g) f.name.focus();
}
function updateTagEx(){ const f = $('#groupForm'); $('#tagEx').textContent = '#' + (slug(f.tag.value) || slug(f.name.value) || 'ICSSP2027'); }
function groupSubmit(e){
  e.preventDefault();
  const f = $('#groupForm'), name = f.name.value.trim();
  if (!name){ $('#groupErr').textContent = 'Give the group a name.'; f.name.focus(); return; }
  if (state.groups.some(x => x.name.toLowerCase() === name.toLowerCase() && x !== editG)){ $('#groupErr').textContent = 'A group with that name already exists.'; return; }
  const rows = $$('#stageRows .stagerow');
  const bad = rows.find(r => r.dataset.id && (!r.querySelector('[data-k=title]').value.trim() || !r.querySelector('[data-k=date]').value));
  if (bad){ $('#groupErr').textContent = 'A saved step needs a name and a date. Fill it in or remove it with ×.'; bad.querySelector('input').focus(); return; }
  const color = +(f.querySelector('[name=color]:checked')?.value || 9);
  let added = 0, removed = 0;
  change(() => {
    let g = editG && state.groups.find(x => x.id === editG.id);
    const fields = { name, kind: f.kind.value, color, tag: slug(f.tag.value) || slug(name) };
    if (g) Object.assign(g, fields); else { g = { id: genId(), ...fields }; state.groups.push(g); }
    touchGroups();
    const keep = new Set(), made = new Set();
    rows.forEach(r => {
      const title = r.querySelector('[data-k=title]').value.trim(), date = r.querySelector('[data-k=date]').value;
      const time = r.querySelector('[data-k=time]').value, done = r.querySelector('[data-k=done]').checked;
      const ex = r.dataset.id && findD(r.dataset.id);
      if (ex){ keep.add(ex.id); putDeadline({ ...ex, title, date, time, done, tz: time ? (ex.tz || 'local') : 'local' }); }
      else if (title && date){ const id = genId(); made.add(id); putDeadline({ id, groupId: g.id, title, type: r.dataset.type, date, time, tz: time ? r.dataset.tz : 'local', notes:'', done }); added++; }
    });
    if (editG) state.deadlines.filter(d => d.groupId === g.id && !keep.has(d.id) && !made.has(d.id)).forEach(d => { delDeadline(d.id); removed++; });
    // every deadline in the group changes title in Google when the group is renamed or recolored
    state.deadlines.filter(d => d.groupId === g.id).forEach(d => enqueue({ t:'d', id: d.id }));
    openGroups.add(g.id); tab = 'groups';
  }, `${editG ? 'Saved' : 'Created'} ${name}${added || removed ? ': ' + [added && added + ' added', removed && removed + ' removed'].filter(Boolean).join(', ') : ''}.`);
  $('#groupDlg').close();
}
function deleteGroup(g){
  const n = state.deadlines.filter(d => d.groupId === g.id).length;
  if (n && !confirm(`Delete "${g.name}" and its ${plural(n, 'deadline')}? You can undo right after.`)) return false;
  change(() => {
    state.deadlines.filter(d => d.groupId === g.id).forEach(d => delDeadline(d.id));
    state.groups = state.groups.filter(x => x.id !== g.id); touchGroups();
  }, `Deleted ${g.name}.`);
  return true;
}

/* =========================================================
   Settings
   ========================================================= */
function renderSettings(){
  const s = state.settings;
  $$('#themeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === s.theme));
  $('#clientId').value = s.clientId;
  $('#gStatus').innerHTML = s.connected
    ? `<span class="badge" style="background:var(--ok-bg);color:var(--ok)">${ic('check')}Connected</span> ${esc(s.email || '')}`
    : `<span class="badge mute">Not connected</span> Data is saved on this device only.`;
  $('#gSetup').hidden = s.connected;
  $('#gConnect').hidden = s.connected; $('#gSync').hidden = !s.connected; $('#gDisconnect').hidden = !s.connected;
  $('#gCals').hidden = !s.connected;
  if (s.connected){
    $('#calList').innerHTML = Object.entries(s.calMeta).filter(([id]) => id !== s.deadlineCalId).map(([id, c]) =>
      `<label><input type="checkbox" data-cal="${esc(id)}"${s.calendars.includes(id) ? ' checked' : ''}><i style="--c:${esc(c.color || '#888')}"></i>${esc(c.name)}${c.primary ? ' (main)' : ''}</label>`).join('') || '<span class="hint">No calendars found.</span>';
  }
  $('#remList').innerHTML = REMINDERS.map(([m, l]) => `<label class="chk" style="margin:0 10px 4px 0"><input type="checkbox" data-rem="${m}"${s.reminders.includes(m) ? ' checked' : ''}>${l} before</label>`).join('');
  $('#defTz').value = s.defaultTz; $('#notifyChk').checked = !!s.notify;
  $('#verLbl').textContent = 'Version ' + VERSION;
}
function setTheme(t, origin){
  state.settings.theme = t; save();
  const apply = () => { if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; paintThemeBtn(); };
  if (document.startViewTransition && motionOK() && origin){
    const r = origin.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate({ clipPath:[`circle(0 at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 520, easing:'cubic-bezier(.3,.7,.2,1)', pseudoElement:'::view-transition-new(root)' });
    }).catch(() => {});
  } else apply();
  renderSettings();
}
const isDark = () => state.settings.theme === 'dark' || (state.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
function paintThemeBtn(){ $('#themeBtn').innerHTML = ic(isDark() ? 'sun' : 'moon'); $('#themeBtn').title = isDark() ? 'Switch to light' : 'Switch to dark'; }

/* ---------- backup ---------- */
function download(name, text, type){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function backup(){
  const data = { v:3, exported: new Date().toISOString(), groups: state.groups, groupsUpdated: state.groupsUpdated, deadlines: state.deadlines,
    meetings: state.meetings.filter(m => m.calId === 'local'), settings: { defaultTz: state.settings.defaultTz, reminders: state.settings.reminders, theme: state.settings.theme } };
  download(`deadlines-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('Backup saved to your Downloads folder.');
}
async function restore(file){
  try{
    const j = JSON.parse(await file.text());
    if (j.v === 3 && Array.isArray(j.deadlines)){
      if (!confirm(`Replace your deadlines and groups with ${plural(j.deadlines.length, 'deadline')} from this backup?`)) return;
      change(() => {
        state.deadlines.forEach(d => delDeadline(d.id));
        state.groups = j.groups; touchGroups();
        j.deadlines.forEach(d => putDeadline({ ...d }));
        (j.meetings || []).forEach(m => putMeeting({ ...m, calId: state.settings.connected ? (state.settings.email || 'primary') : 'local', mine:true, editable:true }));
      }, 'Backup restored.');
    } else if (Array.isArray(j.items)){
      if (!confirm(`Add ${plural(j.items.length, 'deadline')} from the laptop version?`)) return;
      change(() => { importOld(state, j); }, `Imported ${plural(j.items.length, 'deadline')}.`);
    } else throw new Error();
  }catch(e){ toast('That file is not a tracker backup. Pick a deadlines-backup or deadline-backup file.'); }
}

/* =========================================================
   Search (Ctrl K)
   ========================================================= */
let sIdx = 0, sItems = [];
function openSearch(){ $('#searchIn').value = ''; runSearch(); $('#searchDlg').showModal(); $('#searchIn').focus(); }
function runSearch(){
  const q = $('#searchIn').value.trim().toLowerCase();
  const out = [];
  const qd = queryDate(q);
  if (qd) out.push({ k:'date', date: qd, label:`Go to ${fmtD(qd, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}`, c:'var(--ink)' });
  const match = s => !q || String(s || '').toLowerCase().includes(q);
  state.groups.filter(g => match(g.name)).slice(0, q ? 6 : 4).forEach(g => out.push({ k:'g', g, label: g.name, sub: g.kind, c: gcol(g.color) }));
  state.deadlines.filter(d => match(d.title) || match(G(d.groupId).name) || match(d.notes) || match(d.type))
    .sort((a, b) => (a.done - b.done) || Math.abs(+dueAt(a) - Date.now()) - Math.abs(+dueAt(b) - Date.now())).slice(0, 12)
    .forEach(d => out.push({ k:'d', d, label: d.title, sub: `${G(d.groupId).name}, ${d.type}${d.done ? ', done' : ''}`, when: fmtD(dueDay(d)), c: gcol(G(d.groupId).color) }));
  if (q) state.meetings.filter(m => match(m.title) || match(m.desc)).slice(0, 8)
    .forEach(m => out.push({ k:'m', m, label: m.title, sub: 'Meeting', when: m.allDay ? fmtD(m.sd) : fmtD(iso(new Date(m.start))) + ', ' + fmtT(new Date(m.start)), c: mColor(m) }));
  sItems = out; sIdx = 0; paintSearch();
}
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function queryDate(q){
  if (!q) return null;
  if (q === 'today') return todayISO();
  if (q === 'tomorrow') return addDays(todayISO(), 1);
  let m = q.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = q.match(/^(\d{1,2})\s*([a-z]{3,})\.?\s*(\d{4})?$/) || q.match(/^([a-z]{3,})\.?\s*(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (!m) return null;
  const [day, mon] = /^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
  const mi = MONTHS.indexOf(mon.slice(0, 3));
  if (mi < 0 || +day < 1 || +day > 31) return null;
  let y = m[3] ? +m[3] : new Date().getFullYear();
  const d = new Date(y, mi, +day);
  if (!m[3] && d < new Date(Date.now() - 60 * DAY)) d.setFullYear(y + 1);
  return d.getMonth() === mi ? iso(d) : null;
}
function paintSearch(){
  $('#searchRes').innerHTML = sItems.length ? sItems.map((x, i) => `<button role="option" data-i="${i}" aria-selected="${i === sIdx}"><span class="sw" style="--c:${x.c}"></span><span>${esc(x.label)}${x.sub ? `<span class="s">${esc(x.sub)}</span>` : ''}</span><span class="w">${esc(x.when || '')}</span></button>`).join('')
    : `<div class="none">Nothing matches. Try a group name, a title, or a date like 12 Nov.</div>`;
  $(`#searchRes [data-i="${sIdx}"]`)?.scrollIntoView({ block:'nearest' });
}
function pickSearch(i){
  const x = sItems[i]; if (!x) return;
  $('#searchDlg').close();
  if (x.k === 'date'){ selected = x.date; tab = 'day'; jumpTo(x.date); }
  else if (x.k === 'g'){ tab = 'groups'; openGroups.add(x.g.id); render(); }
  else if (x.k === 'd'){ selected = dueDay(x.d); jumpTo(selected); openEntry({ d: x.d }); }
  else { selected = x.m.allDay ? x.m.sd : iso(new Date(x.m.start)); jumpTo(selected); openEntry({ m: x.m }); }
}

/* =========================================================
   Toasts
   ========================================================= */
function toast(msg, action){
  const box = $('#toasts');
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (action){ const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { action.fn(); kill(); }; el.appendChild(b); }
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  let t = setTimeout(kill, action ? 6500 : 4000);
  el.onmouseenter = () => clearTimeout(t); el.onmouseleave = () => { t = setTimeout(kill, 2500); };
  function kill(){ el.classList.add('out'); setTimeout(() => el.remove(), 220); }
}

/* =========================================================
   Navigation
   ========================================================= */
function withTransition(fn, dir){
  if (document.startViewTransition && motionOK()){
    document.documentElement.dataset.dir = dir || 'next';
    document.startViewTransition(fn);
  } else fn();
}
function shift(n){
  withTransition(() => {
    if (view === 'month'){ const d = parseD(anchor); anchor = iso(new Date(d.getFullYear(), d.getMonth() + n, 1)); }
    else anchor = addDays(anchor, n * (view === 'week' ? 7 : 1));
    if (view === 'day') selected = anchor;
    render(); maybeRefetch();
  }, n > 0 ? 'next' : 'prev');
}
function jumpTo(day, quiet){
  const old = visibleDays();
  anchor = day;
  if (!quiet && !old.includes(day)) withTransition(() => render(), day > old[0] ? 'next' : 'prev'); else render();
  maybeRefetch();
}
function setView(v){
  view = v; localStorage.setItem('dt3-view', v);
  if (v === 'day') anchor = selected; else anchor = selected;
  withTransition(() => render());
  maybeRefetch();
}
function maybeRefetch(){
  if (!state.settings.connected || !state.meetRange) return;
  const v = visibleDays();
  if (v[0] < state.meetRange[0] || v[v.length - 1] > state.meetRange[1]) scheduleSync(300);
}
function selectDay(day){ selected = day; tab = 'day'; if (view === 'day') anchor = day; render(); }

/* =========================================================
   Events
   ========================================================= */
function toggleDone(d){
  change(() => { putDeadline({ ...d, done: !d.done }); }, d.done ? 'Marked not done.' : 'Done. Nice work.');
}
function openD(id){ const d = findD(id); if (d) openEntry({ d }); }
function openM(id){ const m = findM(id); if (m) openEntry({ m }); }

function wire(){
  // static icons
  $('#prevBtn').innerHTML = ic('left'); $('#nextBtn').innerHTML = ic('right');
  $('#searchBtn').innerHTML = ic('search'); $('#settingsBtn').innerHTML = ic('gear');
  $('#addMenuBtn').innerHTML = ic('down'); $('#fab').innerHTML = ic('plus'); $('#searchIco').innerHTML = ic('search');
  paintThemeBtn();

  $('#prevBtn').onclick = () => shift(-1);
  $('#nextBtn').onclick = () => shift(1);
  $('#todayBtn').onclick = () => { selected = todayISO(); tab = 'day'; jumpTo(selected); };
  $$('#viewSeg button').forEach(b => b.onclick = () => setView(b.dataset.view));
  $$('.side .tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; renderPanel(); $$('.side .tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); });
  $('#addBtn').onclick = () => openEntry({ kind:'deadline' });
  $('#fab').onclick = () => openEntry({ kind:'deadline' });
  const menu = $('#addMenu');
  $('#addMenuBtn').onclick = e => { e.stopPropagation(); const o = !menu.classList.contains('open'); menu.classList.toggle('open', o); $('#addMenuBtn').setAttribute('aria-expanded', o); if (o) menu.querySelector('button').focus(); };
  document.addEventListener('click', e => { if (!e.target.closest('.addgrp')){ menu.classList.remove('open'); $('#addMenuBtn').setAttribute('aria-expanded', false); } });
  menu.onclick = e => { const b = e.target.closest('[data-add]'); if (!b) return; menu.classList.remove('open'); b.dataset.add === 'group' ? openGroup() : openEntry({ kind: b.dataset.add }); };
  $('#themeBtn').onclick = e => setTheme(isDark() ? 'light' : 'dark', e.currentTarget);
  $('#settingsBtn').onclick = () => { renderSettings(); $('#settingsDlg').showModal(); };
  $('#searchBtn').onclick = openSearch;
  $('#syncPill').onclick = () => {
    if (!state.settings.connected){ renderSettings(); $('#settingsDlg').showModal(); return; }
    sync({ interactive: true });
  };
  $('#hero').onclick = e => { const b = e.target.closest('[data-d]'); if (b) openD(b.dataset.d); else if (e.target.closest('[data-act=addD]')) openEntry({ kind:'deadline' }); };

  // calendar area
  const cal = $('#calwrap');
  cal.addEventListener('click', e => {
    const dc = e.target.closest('[data-d]'); if (dc){ openD(dc.dataset.d); return; }
    const mc = e.target.closest('[data-m]'); if (mc){ openM(mc.dataset.m); return; }
    const more = e.target.closest('[data-more]'); if (more){ selectDay(more.dataset.more); return; }
    const col = e.target.closest('.tl-col');
    if (col){
      const r = col.getBoundingClientRect(), hp = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour'));
      const mins = Math.max(0, Math.min(23.5 * 60, Math.round(((e.clientY - r.top) / hp) * 2) * 30));
      selected = col.dataset.date;
      window.__keepScroll = $('.tl-scroll').scrollTop;
      openEntry({ kind:'meeting', preset:{ date: col.dataset.date, stime: pad(Math.floor(mins / 60)) + ':' + pad(mins % 60) } });
      return;
    }
    const c = e.target.closest('[data-date]'); if (c){ window.__keepScroll = $('.tl-scroll')?.scrollTop; selectDay(c.dataset.date); }
  });
  cal.addEventListener('dblclick', e => {
    if (e.target.closest('[data-d],[data-m],.tl-col')) return;
    const c = e.target.closest('.cell,.tl-due .col'); if (c) openEntry({ kind:'deadline', preset:{ date: c.dataset.date } });
  });
  cal.addEventListener('keydown', e => { const c = e.target.closest('.cell'); if (c && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); selectDay(c.dataset.date); } });
  let wheelAt = 0;
  cal.addEventListener('wheel', e => {
    if (view !== 'month' || e.ctrlKey) return;
    e.preventDefault();
    const now = Date.now(); if (now - wheelAt < 420 || Math.abs(e.deltaY) < 6) return;
    wheelAt = now; shift(e.deltaY > 0 ? 1 : -1);
  }, { passive:false });

  // drag deadlines and meetings to another day
  let drag = null;
  cal.addEventListener('dragstart', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    drag = c.dataset.d ? { d: c.dataset.d } : { m: c.dataset.m };
    e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain', 'x'); }catch(err){}
  });
  cal.addEventListener('dragover', e => {
    if (!drag) return; const c = e.target.closest('.cell,.tl-due .col'); if (!c) return;
    e.preventDefault(); $$('.drop', cal).forEach(x => x !== c && x.classList.remove('drop')); c.classList.add('drop');
  });
  cal.addEventListener('dragleave', e => { const c = e.target.closest('.cell,.tl-due .col'); if (c && !c.contains(e.relatedTarget)) c.classList.remove('drop'); });
  cal.addEventListener('dragend', () => { drag = null; $$('.drop', cal).forEach(x => x.classList.remove('drop')); });
  cal.addEventListener('drop', e => {
    e.preventDefault(); const c = e.target.closest('.cell,.tl-due .col'); const dr = drag; drag = null;
    if (!c || !dr) return render();
    const to = c.dataset.date;
    if (dr.d){
      const d = findD(dr.d); if (!d) return;
      const n = diffDays(to, dueDay(d)); if (!n) return render();
      change(() => { putDeadline({ ...d, date: addDays(d.date, n) }); freshId = d.id; selected = to; }, `Moved to ${fmtD(to)}.`);
    } else {
      const m = findM(dr.m); if (!m || !(m.editable || m.mine)) return render();
      const from = m.allDay ? m.sd : iso(new Date(m.start)); const n = diffDays(to, from); if (!n) return render();
      change(() => {
        const x = { ...m };
        if (x.allDay){ x.sd = addDays(x.sd, n); x.ed = addDays(x.ed, n); }
        else { const s = new Date(x.start), en = new Date(x.end); s.setDate(s.getDate() + n); en.setDate(en.getDate() + n); x.start = s.toISOString(); x.end = en.toISOString(); }
        putMeeting(x); freshId = x.id; selected = to;
      }, `Moved ${m.title} to ${fmtD(to)}.`);
    }
  });

  // side panel
  $('#panel').addEventListener('toggle', e => { if (e.target.matches('details.idle')) idleOpen = e.target.open; }, true);
  $('#panel').addEventListener('click', e => {
    const ga = e.target.closest('[data-gact]');
    if (ga){
      const g = state.groups.find(x => x.id === ga.closest('[data-gid]').dataset.gid); if (!g) return;
      const a = ga.dataset.gact;
      if (a === 'toggle'){ openGroups.has(g.id) ? openGroups.delete(g.id) : openGroups.add(g.id); renderPanel(); }
      if (a === 'add') openEntry({ kind:'deadline', preset:{ group: g.name } });
      if (a === 'edit') openGroup(g);
      if (a === 'delete') deleteGroup(g);
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act){
      const a = act.dataset.act;
      if (a === 'addD') return openEntry({ kind:'deadline', preset:{ date: selected } });
      if (a === 'addM') return openEntry({ kind:'meeting', preset:{ date: selected } });
      if (a === 'newGroup') return openGroup();
      const id = act.closest('[data-d]')?.dataset.d, d = id && findD(id);
      if (!d) return;
      if (a === 'toggle') return toggleDone(d);
      if (a === 'edit') return openEntry({ d });
    }
    const dc = e.target.closest('[data-d]'); if (dc) return openD(dc.dataset.d);
    const mc = e.target.closest('[data-m]'); if (mc) return openM(mc.dataset.m);
  });

  // entry dialog
  const f = ef();
  f.addEventListener('submit', entrySubmit);
  $$('#kindSeg button').forEach(b => b.onclick = () => setKind(b.dataset.kind));
  ['date','time','tz','sdate','stime','edate','etime'].forEach(n => f[n].addEventListener('input', updateHints));
  f.allDay.addEventListener('change', toggleTimed);
  f.sdate.addEventListener('change', () => { if (f.edate.value < f.sdate.value || !f.edate.value) f.edate.value = f.sdate.value; updateHints(); });
  f.etime.addEventListener('change', () => { if (f.edate.value === f.sdate.value && f.etime.value && f.stime.value && f.etime.value <= f.stime.value) f.edate.value = addDays(f.sdate.value, 1); updateHints(); });
  f.title.addEventListener('input', () => $('#entryErr').textContent = '');
  $('#entryDel').onclick = () => {
    if (editD){ const d = editD; $('#entryDlg').close(); change(() => delDeadline(d.id), 'Deadline deleted.'); }
    else if (editM){ const m = editM; if (m.attendees > 1 && !confirm('Delete this meeting from Google Calendar? Guests will not be notified automatically.')) return; $('#entryDlg').close(); change(() => delMeeting(m), 'Meeting deleted.'); }
  };
  $('#entryDup').onclick = () => {
    const pre = { title: f.title.value.trim() + ' (copy)', group: f.group.value, type: f.type.value, date: f.date.value, time: f.time.value, tz: f.tz.value, notes: f.notes.value };
    $('#entryDlg').close(); openEntry({ kind:'deadline', preset: pre }); setTimeout(() => f.title.select(), 40);
  };

  // group dialog
  const gf = $('#groupForm');
  gf.addEventListener('submit', groupSubmit);
  gf.kind.addEventListener('change', () => { if (!editG && !$$('#stageRows [data-k=date]').some(x => x.value)) fillStages(gf.kind.value); });
  gf.name.addEventListener('input', updateTagEx); gf.tag.addEventListener('input', updateTagEx);
  $('#addStage').onclick = () => { const r = stageRow(); $('#stageRows').appendChild(r); r.querySelector('input').focus(); };
  $('#groupDel').onclick = () => { if (editG && deleteGroup(editG)) $('#groupDlg').close(); };

  // settings
  $$('#themeSeg button').forEach(b => b.onclick = e => setTheme(b.dataset.theme, e.currentTarget));
  $('#gConnect').onclick = connectGoogle;
  $('#gSync').onclick = () => sync({ interactive: true, full: true });
  $('#gDisconnect').onclick = disconnectGoogle;
  $('#calList').addEventListener('change', e => {
    const id = e.target.dataset.cal; if (!id) return;
    const s = state.settings; s.calendars = e.target.checked ? [...new Set([...s.calendars, id])] : s.calendars.filter(x => x !== id);
    save(); sync();
  });
  $('#remList').addEventListener('change', e => {
    const m = +e.target.dataset.rem; if (!m) return;
    const s = state.settings;
    let r = e.target.checked ? [...new Set([...s.reminders, m])] : s.reminders.filter(x => x !== m);
    s.reminders = r.sort((a, b) => b - a);
    state.deadlines.forEach(d => enqueue({ t:'d', id: d.id }));
    save(); scheduleSync(1500);
  });
  $('#defTz').onchange = e => { state.settings.defaultTz = e.target.value; save(); };
  $('#notifyChk').onchange = async e => {
    if (e.target.checked && 'Notification' in window){
      const p = await Notification.requestPermission();
      if (p !== 'granted'){ e.target.checked = false; toast('Notifications are blocked for this site in your browser settings.'); return; }
    }
    state.settings.notify = e.target.checked; save();
  };
  $('#backupBtn').onclick = backup;
  $('#restoreBtn').onclick = () => $('#restoreFile').click();
  $('#restoreFile').onchange = e => { const file = e.target.files[0]; e.target.value = ''; if (file){ $('#settingsDlg').close(); restore(file); } };
  $('#eraseBtn').onclick = () => {
    if (!confirm('Erase all tracker data on this device? Anything already in Google Calendar stays there.')) return;
    localStorage.removeItem(KEY); localStorage.removeItem(AUTH_KEY); location.reload();
  };

  // search
  $('#searchIn').addEventListener('input', runSearch);
  $('#searchIn').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown'){ e.preventDefault(); sIdx = Math.min(sItems.length - 1, sIdx + 1); paintSearch(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); sIdx = Math.max(0, sIdx - 1); paintSearch(); }
    else if (e.key === 'Enter'){ e.preventDefault(); pickSearch(sIdx); }
  });
  $('#searchRes').onclick = e => { const b = e.target.closest('[data-i]'); if (b) pickSearch(+b.dataset.i); };
  $('#searchDlg').addEventListener('click', e => { if (e.target === $('#searchDlg')) $('#searchDlg').close(); });

  // dialogs: close buttons and click outside
  $$('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
  $$('dialog').forEach(d => d.addEventListener('mousedown', e => { if (e.target === d){ const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } }));

  // keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); if (!$('#searchDlg').open) openSearch(); return; }
    if ($('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'n' || k === 'N'){ e.preventDefault(); openEntry({ kind:'deadline' }); }
    else if (k === 'm' || k === 'M'){ e.preventDefault(); openEntry({ kind:'meeting' }); }
    else if (k === 'g' || k === 'G'){ e.preventDefault(); openGroup(); }
    else if (k === 't' || k === 'T') $('#todayBtn').click();
    else if (k === '1') setView('month'); else if (k === '2') setView('week'); else if (k === '3') setView('day');
    else if (k === 'ArrowLeft') shift(-1); else if (k === 'ArrowRight') shift(1);
    else if (k === '/'){ e.preventDefault(); openSearch(); }
  });

  // keep in sync with the world
  addEventListener('online', () => sync());
  addEventListener('offline', () => setSync('offline'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden){ render(); scheduleSync(200); } });
  addEventListener('focus', () => scheduleSync(400));
  addEventListener('storage', e => { if (e.key === KEY && e.newValue){ try{ const s = JSON.parse(e.newValue); if (s.v === 3){ state = Object.assign(freshState(), s); render(); } }catch(err){} } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintThemeBtn);
}

/* =========================================================
   Browser notifications while open
   ========================================================= */
function notifyTick(){
  const s = state.settings;
  if (!s.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date(), t = todayISO();
  if (now.getHours() >= 8 && s.lastDigest !== t){
    const due = state.deadlines.filter(d => !d.done && dueDay(d) === t);
    const ms = meetingsOn(t).filter(m => !m.allDay);
    const issues = dayIssues(t).length;
    if (due.length || ms.length){
      new Notification('Today', { body: [due.length && plural(due.length, 'deadline') + ': ' + due.map(d => d.title).join(', '), ms.length && plural(ms.length, 'meeting'), issues && plural(issues, 'warning')].filter(Boolean).join('. '), icon:'icons/icon-192.png', tag:'digest' });
    }
    s.lastDigest = t; save();
  }
  state.deadlines.filter(d => !d.done && d.time).forEach(d => {
    const left = +dueAt(d) - Date.now();
    if (left > 0 && left <= HOUR && !s.notified[d.id]){
      new Notification('Due in ' + Math.max(1, Math.round(left / MIN)) + ' min', { body: `${G(d.groupId).name}: ${d.title}`, icon:'icons/icon-192.png', tag: d.id });
      s.notified[d.id] = Date.now(); save();
    }
  });
}

/* =========================================================
   Start
   ========================================================= */
function start(){
  wire();
  render();
  renderSync();
  setInterval(tickHero, 1000);
  let lastDay = todayISO();
  setInterval(() => {
    const t = todayISO();
    if (t !== lastDay){ if (selected === lastDay) selected = t; lastDay = t; }
    if (!$('dialog[open]')){ window.__keepScroll = $('.tl-scroll')?.scrollTop; render(); }
    renderSync(); notifyTick();
  }, 60000);
  setInterval(() => scheduleSync(0), 3 * 60000);
  if (state.settings.connected) sync();
  notifyTick();
  if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href)) navigator.serviceWorker.register('sw.js').catch(() => {});
  const qp = new URLSearchParams(location.search).get('new');
  if (qp === 'deadline' || qp === 'meeting') setTimeout(() => openEntry({ kind: qp }), 300);
  window.__dt = { get state(){ return state; }, sync, render, version: VERSION };
}
start();
})();
