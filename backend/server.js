// ═══════════════════════════════════════════════════════════════
// VALLEY CARE GROUP — API Server (Vercel KV Edition)
// Node.js / Express · JWT Auth · Vercel KV (Redis) data store
// UK GDPR compliant structure · Helmet security headers
// ═══════════════════════════════════════════════════════════════

'use strict';

// ---------------------------------------------------------------------------
// Load .env if present in local development
// ---------------------------------------------------------------------------
try {
  require('fs').existsSync('.env') && require('fs')
    .readFileSync('.env', 'utf8')
    .split('\n')
    .forEach(line => {
      const [k, ...v] = line.split('=');
      if (k && !k.startsWith('#') && !process.env[k.trim()])
        process.env[k.trim()] = v.join('=').trim();
    });
} catch (_) {}

const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

// ---------------------------------------------------------------------------
// Vercel KV client — falls back to in-memory store for local dev
// ---------------------------------------------------------------------------
let kv;
try {
  kv = require('@vercel/kv');
} catch (_) {
  // Local dev without KV: use a simple in-memory store
  console.warn('⚠️  @vercel/kv not available — using in-memory store (data will not persist between restarts)');
  const store = new Map();
  kv = {
    get: async (key) => store.get(key) ?? null,
    set: async (key, val) => { store.set(key, val); return 'OK'; },
    del: async (key) => { store.delete(key); return 1; },
  };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT       = parseInt(process.env.PORT || '3500', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-before-production';
const ADMIN_PW   = process.env.ADMIN_PASSWORD || 'vcg2025';
const IS_PROD    = process.env.NODE_ENV === 'production';

// CORS: in production, only allow requests from the frontend Vercel domain
const ALLOWED_ORIGINS = IS_PROD
  ? (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
  : true; // any origin in dev

if (IS_PROD && JWT_SECRET === 'dev-secret-change-before-production') {
  console.warn('\n⚠️  WARNING: JWT_SECRET is set to the default dev value. Set a strong secret in Vercel env vars.\n');
}

// ---------------------------------------------------------------------------
// KV key helpers
// ---------------------------------------------------------------------------
const KEY_JOBS     = 'vcg:jobs';
const KEY_CONTENT  = 'vcg:content';
const KEY_ADMINHASH = 'vcg:admin_hash';

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '50kb' }));

// Trust Vercel's proxy so rate-limiter uses real IP
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// ---------------------------------------------------------------------------
// Data helpers — KV-backed
// ---------------------------------------------------------------------------

// ── JOBS ──────────────────────────────────────────────────────────────────
function uid() {
  return 'j_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function seedJobs() {
  return [
    {
      id: uid(), title: 'Registered General Nurse (RGN)',
      home: 'glan', homeLabel: 'Glan-yr-Afon Nursing Home, Blackwood',
      location: 'Off Ford Road, Fleur-de-Lys, Blackwood NP12 3WA',
      type: 'Full-Time', category: 'nursing', status: 'active',
      desc: 'We are seeking a compassionate and experienced RGN to join our nursing team. You will lead a care team, manage complex nursing needs, and uphold the highest standards of clinical care. Day and night shifts available.',
      reqs: 'NMC Registered,Patient-Centred,Team Leadership,Medication Management',
      posted: '2025-03', btnLabel: 'Apply Now',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), title: 'Senior Care Assistant',
      home: 'glan', homeLabel: 'Glan-yr-Afon Nursing Home, Blackwood',
      location: 'Off Ford Road, Fleur-de-Lys, Blackwood NP12 3WA',
      type: 'Full-Time', category: 'care', status: 'active',
      desc: "An excellent opportunity for an experienced care professional to step into a senior role. You'll support nurse-led care teams, supervise junior staff, and be a key point of contact for residents and their families.",
      reqs: 'NVQ Level 2/3,Previous Senior Experience,Person-Centred Care',
      posted: '2025-03', btnLabel: 'Apply Now',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), title: 'Care Assistant',
      home: 'glan', homeLabel: 'Glan-yr-Afon Nursing Home, Blackwood',
      location: 'Off Ford Road, Fleur-de-Lys, Blackwood NP12 3WA',
      type: 'Part-Time', category: 'care', status: 'active',
      desc: "Join our warm and dedicated care team at Glan-yr-Afon. Whether you're new to care or experienced, we welcome your passion. Full training provided. Various shifts available, including nights and weekends.",
      reqs: 'Compassionate,Reliable,Training Provided',
      posted: '2025-03', btnLabel: 'Apply Now',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), title: 'Care Assistant',
      home: 'llys', homeLabel: 'Llys Gwyn Residential Home',
      location: 'Wales', type: 'Full-Time', category: 'care', status: 'active',
      desc: 'Llys Gwyn is looking for a warm, dependable care assistant to join our residential team. You will provide personal care, support daily activities, and build meaningful bonds with our residents.',
      reqs: 'Caring Nature,Good Communication,NVQ Preferred',
      posted: '2025-02', btnLabel: 'Apply Now',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), title: 'Activities Coordinator',
      home: 'llys', homeLabel: 'Llys Gwyn Residential Home',
      location: 'Wales', type: 'Part-Time', category: 'support', status: 'active',
      desc: "Bring joy and engagement to our residents' daily lives! Plan and deliver a variety of activities ranging from fitness and music to community outings and seasonal events. Creativity and enthusiasm essential.",
      reqs: 'Creative,Organised,Experience with Elderly',
      posted: '2025-02', btnLabel: 'Apply Now',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), title: 'Multiple Roles — Opening Soon',
      home: 'pentwyn', homeLabel: 'Pentwyn Nursing Home, Cardiff (Opening Soon)',
      location: 'Marshfield Road, Cardiff CF3 2TU', type: 'Full-Time', category: 'nursing', status: 'active',
      desc: 'We are pre-recruiting for Pentwyn House Nursing Home in Cardiff. Roles include RGNs, Senior Carers, Care Assistants, Activities Coordinators, Kitchen Staff, Domestic Staff, and Administrative support. Register your interest now.',
      reqs: 'All Levels Welcome,Cardiff Based,Passionate About Care',
      posted: '2025-01', btnLabel: 'Express Interest',
      createdAt: new Date().toISOString(),
    },
  ];
}

async function readJobs() {
  const jobs = await kv.get(KEY_JOBS);
  if (!jobs) {
    const seeded = seedJobs();
    await kv.set(KEY_JOBS, seeded);
    console.log('ℹ️  Seeded default jobs into KV store');
    return seeded;
  }
  return Array.isArray(jobs) ? jobs : seedJobs();
}

async function writeJobs(jobs) {
  await kv.set(KEY_JOBS, jobs);
}

// ── CONTENT ───────────────────────────────────────────────────────────────
function defaultContent() {
  return {
    site: {
      announcementEnabled: true,
      announcementText: '🏗️ Exciting news!  Pentwyn Nursing Home is opening in Cardiff — Register your interest →',
      announcementLink: 'homes/pentwyn.html',
      phone: '01633 680217',
      email: 'care@valleycare.wales',
      address: 'Off Ford Road, Fleur-de-Lys, Blackwood NP12 3WA',
    },
    homepage: {
      heroBadge: 'CIW Registered · South Wales · Est. 2005 · 9.9 Rating',
      heroLine1: 'Where Every',
      heroLine2: 'Day Feels',
      heroLine3: 'Home.',
      heroSubtitle: 'Premium residential and nursing care across South Wales. Three unique homes, one unwavering promise — to care for your loved ones as if they were our own family.',
      stat1Value: 20, stat1Suffix: '+', stat1Label: 'Years of Care',
      stat2Value: 3,  stat2Suffix: '',  stat2Label: 'Care Homes',
      stat3Value: 120, stat3Suffix: '+', stat3Label: 'Residents Cared For',
      stat4Value: 41, stat4Suffix: '',  stat4Label: '5-Star Reviews',
    },
    testimonials: [
      { id: 'tt1', name: 'Sarah M.', relation: 'Daughter of resident', home: 'Glan-yr-Afon Nursing Home', initials: 'S', avatarColor: '#1B4F72', text: "The care Mum receives at Glan-yr-Afon is truly exceptional. The staff know her personally — her likes, her quirks, her stories. She's not just a resident, she's family to them. We could not have found a better place." },
      { id: 'tt2', name: 'Robert T.', relation: 'Son of resident', home: 'Llys Gwyn Residential Home', initials: 'R', avatarColor: '#117A65', text: "Dad is genuinely happy at Llys Gwyn. He has friends, joins activities he loves, and talks about the staff with real warmth. Seeing him flourish has been the most enormous relief for our whole family. We are so grateful." },
      { id: 'tt3', name: 'Anita P.', relation: 'Wife of resident', home: 'Glan-yr-Afon Nursing Home', initials: 'A', avatarColor: '#6C3483', text: "The nursing team at Glan-yr-Afon go above and beyond every single day. The clinical care is outstanding, and the home is always spotless and cheerful. When I visit my husband I leave feeling at peace, not worried. That's priceless." },
    ],
    live: {},
  };
}

async function readContent() {
  const c = await kv.get(KEY_CONTENT);
  if (!c) {
    const d = defaultContent();
    await kv.set(KEY_CONTENT, d);
    return d;
  }
  return c;
}

async function writeContent(c) {
  await kv.set(KEY_CONTENT, c);
}

// ── ADMIN HASH ────────────────────────────────────────────────────────────
async function getAdminHash() {
  let hash = await kv.get(KEY_ADMINHASH);
  if (!hash) {
    hash = bcrypt.hashSync(ADMIN_PW, 12);
    await kv.set(KEY_ADMINHASH, hash);
    console.log('🔐 Admin password hash generated and stored in KV');
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorisation required. Please sign in to the admin console.' });
  }
  try {
    req.admin = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'Session expired. Please sign in again.' : 'Invalid token.',
    });
  }
}

// ---------------------------------------------------------------------------
// String sanitiser
// ---------------------------------------------------------------------------
function sanitise(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

// ---------------------------------------------------------------------------
// ── AUTH ROUTES
// ---------------------------------------------------------------------------

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }
  try {
    const hash  = await getAdminHash();
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      await new Promise(r => setTimeout(r, 600));
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    const expiresIn = 8 * 60 * 60;
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn });
    res.json({ token, expiresIn });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true, role: req.admin.role });
});

// ---------------------------------------------------------------------------
// ── PUBLIC ROUTES
// ---------------------------------------------------------------------------

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = (await readJobs()).filter(j => j.status === 'active');
    res.json(jobs);
  } catch (err) {
    console.error('GET /api/jobs error:', err.message);
    res.status(500).json({ error: 'Unable to load job listings.' });
  }
});

app.get('/api/content', async (req, res) => {
  try { res.json(await readContent()); }
  catch { res.status(500).json({ error: 'Unable to load content.' }); }
});

// ---------------------------------------------------------------------------
// ── ADMIN ROUTES (protected)
// ---------------------------------------------------------------------------

app.get('/api/admin/jobs', requireAuth, async (req, res) => {
  try { res.json(await readJobs()); }
  catch (err) { res.status(500).json({ error: 'Unable to read jobs data.' }); }
});

app.post('/api/admin/jobs', requireAuth, async (req, res) => {
  try {
    const jobs = await readJobs();
    const job = {
      id:        uid(),
      title:     sanitise(req.body.title),
      home:      sanitise(req.body.home),
      homeLabel: sanitise(req.body.homeLabel),
      location:  sanitise(req.body.location),
      type:      sanitise(req.body.type),
      category:  sanitise(req.body.category),
      desc:      sanitise(req.body.desc),
      reqs:      sanitise(req.body.reqs),
      posted:    sanitise(req.body.posted),
      status:    ['active','hidden'].includes(req.body.status) ? req.body.status : 'active',
      btnLabel:  sanitise(req.body.btnLabel) || 'Apply Now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!job.title || !job.home || !job.type || !job.category || !job.desc) {
      return res.status(400).json({ error: 'Missing required fields: title, home, type, category, desc.' });
    }
    jobs.push(job);
    await writeJobs(jobs);
    console.log(`✅ Job created: "${job.title}" (${job.id})`);
    res.status(201).json(job);
  } catch (err) {
    console.error('POST /api/admin/jobs error:', err.message);
    res.status(500).json({ error: 'Failed to save job.' });
  }
});

app.put('/api/admin/jobs/:id', requireAuth, async (req, res) => {
  try {
    const jobs = await readJobs();
    const idx  = jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found.' });
    const updated = {
      ...jobs[idx],
      title:     sanitise(req.body.title)     || jobs[idx].title,
      home:      sanitise(req.body.home)      || jobs[idx].home,
      homeLabel: sanitise(req.body.homeLabel) || jobs[idx].homeLabel,
      location:  sanitise(req.body.location),
      type:      sanitise(req.body.type)      || jobs[idx].type,
      category:  sanitise(req.body.category)  || jobs[idx].category,
      desc:      sanitise(req.body.desc)      || jobs[idx].desc,
      reqs:      sanitise(req.body.reqs),
      posted:    sanitise(req.body.posted),
      status:    ['active','hidden'].includes(req.body.status) ? req.body.status : jobs[idx].status,
      btnLabel:  sanitise(req.body.btnLabel)  || 'Apply Now',
      updatedAt: new Date().toISOString(),
    };
    jobs[idx] = updated;
    await writeJobs(jobs);
    console.log(`✏️  Job updated: "${updated.title}" (${updated.id})`);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/jobs error:', err.message);
    res.status(500).json({ error: 'Failed to update job.' });
  }
});

app.delete('/api/admin/jobs/:id', requireAuth, async (req, res) => {
  try {
    const jobs = await readJobs();
    const idx  = jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found.' });
    const [deleted] = jobs.splice(idx, 1);
    await writeJobs(jobs);
    console.log(`🗑️  Job deleted: "${deleted.title}" (${deleted.id})`);
    res.json({ deleted: true, id: deleted.id });
  } catch (err) {
    console.error('DELETE /api/admin/jobs error:', err.message);
    res.status(500).json({ error: 'Failed to delete job.' });
  }
});

app.patch('/api/admin/jobs/:id/status', requireAuth, async (req, res) => {
  try {
    const jobs = await readJobs();
    const job  = jobs.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    const { status } = req.body;
    if (!['active','hidden'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "hidden".' });
    }
    job.status    = status;
    job.updatedAt = new Date().toISOString();
    await writeJobs(jobs);
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ── Content routes ─────────────────────────────────────────────────────────

app.put('/api/admin/content/:section', requireAuth, async (req, res) => {
  try {
    const c = await readContent();
    const sec = req.params.section;
    if (!['site','homepage','live'].includes(sec)) return res.status(400).json({ error: 'Unknown section.' });
    c[sec] = { ...c[sec], ...req.body };
    await writeContent(c);
    console.log(`✏️  Content updated: ${sec}`);
    res.json(c[sec]);
  } catch (err) { res.status(500).json({ error: 'Failed to save content.' }); }
});

app.get('/api/admin/content/testimonials', requireAuth, async (req, res) => {
  try { res.json((await readContent()).testimonials || []); }
  catch { res.status(500).json({ error: 'Failed to read testimonials.' }); }
});

app.post('/api/admin/content/testimonials', requireAuth, async (req, res) => {
  try {
    const c = await readContent();
    const t = {
      id:          'tt_' + Date.now(),
      name:        sanitise(req.body.name),
      relation:    sanitise(req.body.relation),
      home:        sanitise(req.body.home),
      initials:    sanitise(req.body.initials).slice(0, 2),
      avatarColor: /^#[0-9a-fA-F]{3,6}$/.test(req.body.avatarColor) ? req.body.avatarColor : '#1B4F72',
      text:        sanitise(req.body.text),
    };
    if (!t.name || !t.text) return res.status(400).json({ error: 'name and text are required.' });
    c.testimonials.push(t);
    await writeContent(c);
    res.status(201).json(t);
  } catch { res.status(500).json({ error: 'Failed to add testimonial.' }); }
});

app.put('/api/admin/content/testimonials/:id', requireAuth, async (req, res) => {
  try {
    const c = await readContent();
    const i = c.testimonials.findIndex(t => t.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Testimonial not found.' });
    c.testimonials[i] = {
      ...c.testimonials[i],
      name:        sanitise(req.body.name)     || c.testimonials[i].name,
      relation:    sanitise(req.body.relation),
      home:        sanitise(req.body.home),
      initials:    sanitise(req.body.initials).slice(0, 2),
      avatarColor: /^#[0-9a-fA-F]{3,6}$/.test(req.body.avatarColor) ? req.body.avatarColor : c.testimonials[i].avatarColor,
      text:        sanitise(req.body.text)     || c.testimonials[i].text,
    };
    await writeContent(c);
    res.json(c.testimonials[i]);
  } catch { res.status(500).json({ error: 'Failed to update testimonial.' }); }
});

app.delete('/api/admin/content/testimonials/:id', requireAuth, async (req, res) => {
  try {
    const c = await readContent();
    const before = c.testimonials.length;
    c.testimonials = c.testimonials.filter(t => t.id !== req.params.id);
    if (c.testimonials.length === before) return res.status(404).json({ error: 'Testimonial not found.' });
    await writeContent(c);
    res.json({ deleted: true });
  } catch { res.status(500).json({ error: 'Failed to delete testimonial.' }); }
});

// ---------------------------------------------------------------------------
// 404 handler for unknown API routes
// ---------------------------------------------------------------------------
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ---------------------------------------------------------------------------
// Root health check (Vercel expects a response at /)
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Valley Care Group API', version: '2.0.0' });
});

// Catch-all for non-API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found. This is the API server — visit the frontend URL for the website.' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ---------------------------------------------------------------------------
// Start server (for local development — Vercel uses api/index.js instead)
// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Valley Care Group — API Server Started      ║');
    console.log(`║   http://localhost:${PORT}                        ║`);
    console.log('║   Environment: ' + (IS_PROD ? 'production' : 'development') + '                    ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
  });
}

module.exports = app;
