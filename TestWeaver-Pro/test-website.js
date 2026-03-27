/**
 * server.js
 * Single-file multi-page test website for LLM / automation agent testing.
 *
 * Features:
 *  - Single file Node.js + Express server
 *  - Navbar on every page (clean horizontal bar)
 *  - Home, Instructions, Big Form (huge), Interaction, Logs, Login, Multi-step form
 *  - Big form includes almost every input type and captcha simulation
 *  - Expected vs Actual logs comparison page (two columns)
 *  - Server-side logging + client-side logging endpoints
 *  - Random dynamic IDs, hidden honeypots, simulated delays & obstacles
 *  - Simple auth simulation (no real security, just for agent flows)
 *
 * Usage:
 * 1. npm install express
 * 2. node server.js
 * 3. Visit http://localhost:3000
 */

const express = require("express");
const app = express();
const port = 9211;

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory log stores (volatile)
let actualLogs = [];
const expectedLogs = [
  "Agent visited /instructions",
  "Agent visited /login",
  "Agent logged in",
  "Agent visited /form",
  "Agent filled every field in the form",
  "Agent solved captcha and submitted the form",
  "Agent visited /interaction",
  "Agent clicked button-1",
  "Agent clicked button-2",
  "Agent increased counter x3",
  "Agent toggled checkbox",
  "Agent visited /multi-step-start",
  "Agent completed multi-step form",
  "Agent visited /logs"
];

// Configuration
const CONFIG = {
  randomDelayMsMax: 900, // up to ~1s random server-side delay to simulate latency
  dynamicIdPrefix: "dyn_", // prefix for dynamic element IDs
  enableRandomObstacles: true, // enable simulated errors or hidden fields
};

// utilities
function randStr(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function maybeDelay(fn) {
  // wraps response sending in a small random delay to simulate real-world latency
  const delay = CONFIG.randomDelayMsMax ? Math.floor(Math.random() * CONFIG.randomDelayMsMax) : 0;
  setTimeout(fn, delay);
}

function logActual(event) {
  const entry = `[${new Date().toISOString()}] ${event}`;
  actualLogs.push(entry);
  console.log(entry);
}

// Basic navbar used in every page
function navbarHTML() {
  return `
    <div class="navbar">
      <a href="/">Home</a>
      <a href="/instructions">Instructions</a>
      <a href="/login">Login</a>
      <a href="/form">Big Form</a>
      <a href="/multi-step-start">Multi-step Form</a>
      <a href="/interaction">Interaction</a>
      <a href="/logs">Logs</a>
    </div>
  `;
}

// Page header with css and navbar (style B - clean with hover)
function pageHeader(title) {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <style>
      :root { --nav-bg: #f3f4f6; --accent: #2b6cb0; --muted: #666; }
      body { font-family: Arial, Helvetica, sans-serif; margin:0; padding:20px; background:#fff; color:#111; }
      .container { max-width:1100px; margin: 0 auto; }
      .navbar { background: var(--nav-bg); padding:12px 16px; border-radius:6px; margin-bottom:18px; display:flex; gap:12px; align-items:center; }
      .navbar a { text-decoration:none; color:#111; padding:6px 8px; border-radius:4px; }
      .navbar a:hover { background: rgba(43,108,176,0.08); color: var(--accent); }
      h1 { margin-top:0; }
      .card { background:#fbfbfb; padding:14px; border-radius:8px; border:1px solid #eee; }
      .muted { color:var(--muted); font-size:0.95rem; }
      label { display:block; margin-top:12px; font-weight:600; }
      input, select, textarea, button { font-size:14px; }
      input[type="text"], input[type="email"], input[type="url"], input[type="password"], input[type="tel"], input[type="number"], select, textarea {
        padding:8px; width: 360px; border-radius:6px; border:1px solid #ddd; display:block;
      }
      .small { width:140px; display:inline-block; }
      .inline { display:inline-block; margin-right:8px; vertical-align: middle; }
      button { padding:8px 12px; border-radius:6px; border: none; background: var(--accent); color:white; cursor:pointer; }
      button.secondary { background: #666; }
      .two-col { display:flex; gap:16px; align-items:flex-start; }
      .col-left { flex:1; }
      .col-right { flex:1; }
      pre { background:#fff; border:1px solid #eee; padding:12px; border-radius:6px; max-height:60vh; overflow:auto; }
      .hint { font-size:0.9rem; color:#444; }
      .danger { color:#b80f0f; }
      .ok { color: #0b7a3a; }
      footer { margin-top:40px; font-size:0.9rem; color:#666; }
      .log-row { font-family: monospace; font-size:12px; margin-bottom:6px; }
      .center { text-align:center; }
    </style>
  </head>
  <body>
    <div class="container">
      ${navbarHTML()}
  `;
}

function pageFooter() {
  return `
      <footer>
        <div class="muted">Test website for automation agents — single-file server. (In-memory logs)</div>
      </footer>
    </div>
  </body>
  </html>
  `;
}

/* -------------------------------------------------------
   ROUTES
   Note: some pages intentionally call logActual() both
   server-side (when page served) and client-side via JS
-------------------------------------------------------- */

// Home
app.get("/", (req, res) => {
  logActual("Visited /");
  maybeDelay(() => {
    res.send(
      pageHeader("Home") +
      `
      <div class="card">
        <h1>Automation Agent Playground</h1>
        <p class="muted">This single-file test site is built to evaluate automation agents and LLMs. Use the navbar to navigate.</p>

        <h3>Quick links</h3>
        <ul>
          <li><a href="/instructions">Instructions for agents</a></li>
          <li><a href="/login">Simulated Login</a></li>
          <li><a href="/form">Big Form (full)</a></li>
          <li><a href="/multi-step-start">Multi-step Form (start)</a></li>
          <li><a href="/interaction">Interaction Page</a></li>
          <li><a href="/logs">Logs (expected vs actual)</a></li>
        </ul>

        <p class="hint">Tip: The form includes many field types, honeypots, dynamic element IDs and a captcha math challenge. The logs page has expected steps the agent should follow.</p>
      </div>
      ` + pageFooter()
    );
  });
});

// Instructions for LLM agent (explicit steps)
app.get("/instructions", (req, res) => {
  logActual("Visited /instructions");
  const token = randStr(8);
  maybeDelay(() => {
    res.send(
      pageHeader("Instructions") +
      `
      <div class="card">
        <h1>Agent Instructions (follow exactly)</h1>
        <p class="muted">Steps (strict order):</p>

        <ol>
          <li>Visit <b>login page </b> and perform simulated login (enter any username/password & press Login).</li>
          <li>Go to <b>Big form page</b>. Fill every visible field with valid values. <span class="hint">Hint: fill checkboxes, radios, selects, ranges, color, date, number, url, tel, file (simulate using agent's file upload), and textareas.</span></li>
          <li>Solve the <b>captcha</b> (a small math sum) shown on the form and submit.</li>
          <li>After submission, proceed to <b>interaction page </b>. Execute the interactive sequence: Click Button 1, Click Button 2, Click "Increase Counter" 3 times, Toggle the checkbox.</li>
          <li>Start the multi-step form via <b>/multi-step-start</b> and complete both steps.</li>
          <li>Finally visit <b>logs page </b> and verify your actions against the expected sequence on the left.</li>
        </ol>

        <h3>Important details</h3>
        <ul>
          <li>The site uses <b>dynamic element IDs</b> to emulate a real site. IDs are randomized per page load.</li>
          <li>Some hidden honeypot fields exist — do NOT fill fields with names starting with <code>hp_</code>.</li>
          <li>There may be small random server delays to simulate latency. Be patient.</li>
        </ul>

        <p class="muted">Unique page token (for debugging): <code>${token}</code></p>

      </div>
      ` + pageFooter()
    );
  });
});

// Simple simulated login page (agent should hit this first in expected logs)
app.get("/login", (req, res) => {
  logActual("Visited /login");
  const dyn = CONFIG.dynamicIdPrefix + randStr(5);

  maybeDelay(() => {
    res.send(
      pageHeader("Login") +
      `
      <div class="card">
        <h1>Simulated Login</h1>
        <p class="muted">This is a simulated login to test agent session flows. Any non-empty credentials succeed.</p>

        <form method="POST" action="/login">
          <label>Username</label>
          <input id="${dyn}_user" name="username" type="text" placeholder="agent_user">

          <label>Password</label>
          <input id="${dyn}_pass" name="password" type="password" placeholder="secret">

          <label style="font-weight:500">Remember me</label>
          <input id="${dyn}_remember" name="remember" type="checkbox">

          <div style="margin-top:12px;">
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
      ` + pageFooter()
    );
  });
});

app.post("/login", (req, res) => {
  const { username } = req.body;
  logActual(`Login attempted with username="${username || ""}"`);
  maybeDelay(() => {
    // mark 'login' visit in logs
    logActual("Agent logged in");
    res.send(
      pageHeader("Login Result") +
      `
      <div class="card center">
        <h2>Login successful</h2>
        <p class="muted">User: <strong>${username || "agent"}</strong></p>
        <p><a href="/form">Proceed to Big Form</a></p>
      </div>
      ` + pageFooter()
    );
  });
});

/* ---------------------------
   BIG FORM (single page, huge)
   Includes:
   - many input types
   - file (note: file upload not actually saved)
   - honeypot fields (hp_xxx)
   - captcha math challenge
   - hidden dynamic fields
----------------------------- */
app.get("/form", (req, res) => {
  logActual("Visited /form");
  // dynamic IDs and captcha
  const dyn = CONFIG.dynamicIdPrefix + randStr(6);
  const captchaA = Math.floor(Math.random() * 9) + 1;
  const captchaB = Math.floor(Math.random() * 9) + 1;
  const captchaSum = captchaA + captchaB; // expected value stored server-side per visit? We'll embed in hidden token

  // store ephemeral captcha token in query param? We'll embed a simple token in HTML and also verify submitted sum.
  const obstacle = CONFIG.enableRandomObstacles && Math.random() < 0.25; // 25% chance insert extra obstacle
  const obstacleNote = obstacle ? "<p class='danger'>Note: This page has a simulated obstacle (slow load / randomized element)</p>" : "";

  maybeDelay(() => {
    res.send(
      pageHeader("Big Form") +
      `
      <div class="card">
        <h1>Big Detailed Form</h1>
        <p class="muted">This form contains many different input types. Fill everything visible. There's a simple math captcha at the bottom.</p>
        ${obstacleNote}
        <form id="${dyn}_bigform" method="POST" action="/submit-form" enctype="multipart/form-data">
          <!-- Visible fields -->
          <label>Full name</label>
          <input id="${dyn}_fullname" name="fullname" type="text" placeholder="John Doe">

          <label>Email</label>
          <input id="${dyn}_email" name="email" type="email" placeholder="john@example.com">

          <label>Password</label>
          <input id="${dyn}_password" name="password" type="password">

          <label>Phone</label>
          <input id="${dyn}_phone" name="phone" type="tel">

          <label>Website</label>
          <input id="${dyn}_url" name="website" type="url">

          <label>Age</label>
          <input id="${dyn}_age" name="age" type="number" min="1" max="120">

          <label>Date of birth</label>
          <input id="${dyn}_dob" name="dob" type="date">

          <label>Favorite color</label>
          <input id="${dyn}_color" name="color" type="color">

          <label>Range (0-100)</label>
          <input id="${dyn}_range" name="range" type="range" min="0" max="100">

          <label>Search</label>
          <input id="${dyn}_search" name="search" type="search" placeholder="query...">

          <label>Gender</label>
          <div>
            <input id="${dyn}_g_m" name="gender" type="radio" value="male"> <label class="inline">Male</label>
            <input id="${dyn}_g_f" name="gender" type="radio" value="female"> <label class="inline">Female</label>
            <input id="${dyn}_g_o" name="gender" type="radio" value="other"> <label class="inline">Other</label>
          </div>

          <label>Skills (checkboxes)</label>
          <div>
            <input id="${dyn}_chk_html" name="skill_html" type="checkbox" value="html"> HTML
            <input id="${dyn}_chk_css" name="skill_css" type="checkbox" value="css"> CSS
            <input id="${dyn}_chk_js" name="skill_js" type="checkbox" value="js"> JS
          </div>

          <label>Country</label>
          <select id="${dyn}_country" name="country">
            <option value="">--select--</option>
            <option>India</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Germany</option>
            <option>Japan</option>
          </select>


          <label>Bio</label>
          <textarea id="${dyn}_bio" name="bio" rows="4" cols="50"></textarea>

          <label>Time (current)</label>
          <input id="${dyn}_time" name="time" type="time">

          <label>Month</label>
          <input id="${dyn}_month" name="month" type="month">

          <label>Week</label>
          <input id="${dyn}_week" name="week" type="week">

          <label>Color (text)</label>
          <input id="${dyn}_color_text" name="favorite_color_text" type="text" placeholder="#aabbcc">

          <label>Hidden dynamic field (DO NOT FILL unless agent is instructed)</label>
          <input type="hidden" id="${dyn}_token" name="page_token" value="${dyn}_${captchaSum}">

          <!-- Honeypot fields (should remain empty) -->
          <label style="display:none;">Do not fill (honeypot)</label>
          <input style="display:none;" name="hp_never_fill" type="text" autocomplete="off" value="">

          <label class="muted">Captcha: What is <strong>${captchaA} + ${captchaB}</strong> ?</label>
          <input id="${dyn}_captcha" name="captcha" type="number" placeholder="sum">

          <!-- simulated optional anti-bot checkbox -->
          <div style="margin-top:12px;">
            <input id="${dyn}_iagree" name="iagree" type="checkbox"> <label for="${dyn}_iagree" class="inline">I confirm I'm an automation agent</label>
          </div>

          <div style="margin-top:14px;">
            <button type="submit">Submit Big Form</button>
          </div>
        </form>
      </div>

      <script>
        // client-side event logging for each element interaction
        (function(){
          const dyn = "${dyn}";
          const log = (msg) => fetch('/log-action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ msg }) });
          // Log page open
          log('opened_form_page');

          // attach listeners
          const fields = document.querySelectorAll('#' + dyn + '_bigform input, #' + dyn + '_bigform select, #' + dyn + '_bigform textarea, #' + dyn + '_bigform button');
          fields.forEach(f => {
            f.addEventListener('change', (e) => {
              log('field_changed:' + (e.target.name || e.target.id));
            });
            f.addEventListener('click', (e) => {
              log('field_clicked:' + (e.target.name || e.target.id));
            });
            f.addEventListener('focus', (e) => {
              log('field_focus:' + (e.target.name || e.target.id));
            });
          });
        })();
      </script>
      ` + pageFooter()
    );
  });
});

app.post("/submit-form", (req, res) => {
  // Because we didn't configure file parser, file fields won't be parsed; we focus on textual inputs.
  // Validate captcha: 'page_token' includes token and expected sum embedded. Format: <dyn>_<sum>
  logActual("POST /submit-form received raw body keys: " + Object.keys(req.body).join(","));
  const body = req.body || {};
  const token = body.page_token || "";
  // verify honeypot
  if ((body.hp_never_fill || "").trim() !== "") {
    logActual("Honeypot triggered -> bot detected");
    maybeDelay(() => {
      res.send(pageHeader("Bot detected") + `<div class="card"><h2 class="danger">Submission blocked: honeypot field filled.</h2><p>If you are an agent, do not fill hidden fields starting with 'hp_'.</p><a href="/form">Back to form</a></div>` + pageFooter());
    });
    return;
  }
  // parse expected captcha from token (last underscores)
  const parts = token.split("_");
  const expectedCaptcha = parseInt(parts[parts.length - 1]) || null;
  const captchaProvided = parseInt(body.captcha);
  if (expectedCaptcha === null || isNaN(captchaProvided) || captchaProvided !== expectedCaptcha) {
    logActual(`Captcha validation failed. expected=${expectedCaptcha} provided=${captchaProvided}`);
    maybeDelay(() => {
      res.send(pageHeader("Captcha failed") + `<div class="card"><h2 class="danger">Captcha incorrect</h2><p>Expected answer is not matched. Please try again.</p><a href="/form">Back to form</a></div>` + pageFooter());
    });
    return;
  }

  // basic "all fields present" check: ensure some required fields are non-empty
  const required = ["fullname", "email", "password"];
  const missing = required.filter(k => !(body[k] || "").toString().trim());
  if (missing.length) {
    logActual("Form submission missing required: " + missing.join(","));
    maybeDelay(() => {
      res.send(pageHeader("Form incomplete") + `<div class="card"><h2 class="danger">Missing required fields: ${missing.join(",")}</h2><p>Fill required fields and try again.</p><a href="/form">Back to form</a></div>` + pageFooter());
    });
    return;
  }

  // ok: accept submission
  logActual("Form submitted successfully by agent. Collected keys: " + Object.keys(body).join(","));
  // Add semantic events to actual logs to match expected sequence
  logActual("Agent filled every field in form");
  logActual("Agent solved captcha and submitted the form");

  maybeDelay(() => {
    res.send(pageHeader("Form Submitted") + `
      <div class="card center">
        <h2 class="ok">Form submitted successfully</h2>
        <p class="muted">Thank you. Proceed to the <a href="/interaction">Interaction Page</a>.</p>
      </div>
    ` + pageFooter());
  });
});

/* ----------------------------------------------
   MULTI-STEP FORM (step 1 -> step 2)
   - Start at /multi-step-start
   - Step1 posts to /multi-step-step1 -> redirects to /multi-step-step2
   - Step2 posts to /multi-step-complete
----------------------------------------------- */
app.get("/multi-step-start", (req, res) => {
  logActual("Visited /multi-step-start");
  const dyn = CONFIG.dynamicIdPrefix + randStr(5);
  maybeDelay(() => {
    res.send(pageHeader("Multi-step Form - Step 1") + `
      <div class="card">
        <h1>Multi-step Form — Step 1</h1>
        <p class="muted">Fill the first step and proceed to step 2.</p>
        <form method="POST" action="/multi-step-step1">
          <label>Step1: Favorite language</label>
          <input name="fav_lang" type="text" placeholder="JavaScript">

          <label>Step1: Experience years</label>
          <input name="exp_years" type="number" min="0" max="50">

          <div style="margin-top:12px;">
            <button type="submit">Continue to Step 2</button>
          </div>
        </form>
      </div>
    ` + pageFooter());
  });
});

app.post("/multi-step-step1", (req, res) => {
  const body = req.body || {};
  logActual("Multi-step step1 submitted: " + JSON.stringify(body));
  // store in a quick ephemeral way using redirect with query (not secure but fine for test)
  const q = encodeURIComponent(JSON.stringify(body));
  maybeDelay(() => res.redirect("/multi-step-step2?data=" + q));
});

app.get("/multi-step-step2", (req, res) => {
  logActual("Visited /multi-step-step2");
  const data = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : {};
  maybeDelay(() => {
    res.send(pageHeader("Multi-step Form - Step 2") + `
      <div class="card">
        <h1>Multi-step Form — Step 2</h1>
        <p class="muted">Complete step2 and submit.</p>
        <form method="POST" action="/multi-step-complete">
          <input type="hidden" name="prev" value='${JSON.stringify(data)}'>

          <label>Step2: Portfolio URL</label>
          <input name="portfolio" type="url" placeholder="https://example.com">

          <label>Step2: Short bio</label>
          <textarea name="step2_bio" rows="3"></textarea>

          <div style="margin-top:12px;">
            <button type="submit">Complete Multi-step Form</button>
          </div>
        </form>
      </div>
    ` + pageFooter());
  });
});

app.post("/multi-step-complete", (req, res) => {
  logActual("Multi-step complete payload keys: " + Object.keys(req.body).join(","));
  logActual("Agent completed multi-step form");
  maybeDelay(() => {
    res.send(pageHeader("Multi-step Completed") + `
      <div class="card center">
        <h2 class="ok">Multi-step form completed</h2>
        <p><a href="/logs">View Logs</a></p>
      </div>
    ` + pageFooter());
  });
});

/* ---------------------------
   INTERACTION PAGE
   - Buttons, toggles, counter
   - Buttons emit client-side logs via fetch POST /log-action
----------------------------- */
app.get("/interaction", (req, res) => {
  logActual("Visited /interaction");
  const dyn = CONFIG.dynamicIdPrefix + randStr(5);
  maybeDelay(() => {
    res.send(pageHeader("Interaction Page") + `
      <div class="card">
        <h1>Interaction Page</h1>
        <p class="muted">Perform the UI interactions in this order: Click Button 1, Click Button 2, Increase Counter x3, Toggle Checkbox.</p>

        <div style="margin-top:10px;">
          <button id="${dyn}_btn1">Click Me 1</button><br>
          <button id="${dyn}_btn2" style="margin-top:8px;">Click Me 2</button><br>
          <button id="${dyn}_inc" class="secondary" style="margin-top:8px;">Increase Counter</button>
          <p>Counter: <span id="${dyn}_counter">0</span></p>

          <label><input id="${dyn}_toggle" type="checkbox"> Toggle me</label>
        </div>

        <p class="muted">Client-side logging also prints to console and posts to server endpoint.</p>
      </div>

      <script>
        const dyn = "${dyn}";
        function postLog(msg) {
          // send structured log to server
          fetch('/log-action', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ msg })
          }).catch(()=>{console.warn('log failed', msg)});
          console.log('CLIENT-LOG:', msg);
        }

        document.getElementById(dyn + '_btn1').addEventListener('click', () => {
          postLog('button-1');
          alert('Button 1 clicked');
        });

        document.getElementById(dyn + '_btn2').addEventListener('click', () => {
          postLog('button-2');
          alert('Button 2 clicked');
        });

        document.getElementById(dyn + '_inc').addEventListener('click', () => {
          const el = document.getElementById(dyn + '_counter');
          el.innerText = parseInt(el.innerText) + 1;
          postLog('counter-increment');
        });

        document.getElementById(dyn + '_toggle').addEventListener('change', (e) => {
          postLog('toggle-checkbox:' + (e.target.checked ? 'on' : 'off'));
        });

        // On open
        postLog('opened_interaction_page');
      </script>
    ` + pageFooter());
  });
});

/* ---------------------------
   Log-action endpoint (POST)
   Accepts JSON { msg: "..." }
   Stores server-side normalized events.
----------------------------- */
app.post("/log-action", (req, res) => {
  const msg = (req.body && req.body.msg) || (req.query && req.query.msg) || "unknown";
  logActual("Interaction: " + msg);

  // Map certain client messages to expected human-friendly logs to compare
  if (msg === "button-1") logActual("Agent clicked button-1");
  if (msg === "button-2") logActual("Agent clicked button-2");
  if (msg === "counter-increment") logActual("Agent increased counter");
  if (msg && msg.startsWith("toggle-checkbox")) logActual("Agent toggled checkbox");
  if (msg === "opened_interaction_page") logActual("Agent visited /interaction");

  res.json({ ok: true });
});

/* ---------------------------
   LOGS PAGE: expected vs actual
----------------------------- */
app.get("/logs", (req, res) => {
  logActual("Visited /logs");
  maybeDelay(() => {
    res.send(pageHeader("Logs - Expected vs Actual") + `
      <div class="two-col" style="gap:24px;">
        <div class="col-left card">
          <h2>Expected Log Sequence</h2>
          <pre id="expected">${expectedLogs.map((l,i)=> (i+1)+'. '+l).join('\\n')}</pre>
        </div>

        <div class="col-right card">
          <h2>Actual Agent Logs (server)</h2>
          <pre id="actual">${actualLogs.join('\\n') || '[no logs yet]'}</pre>

          <div style="margin-top:12px;">
            <button id="refresh">Refresh</button>
            <button id="clear" class="secondary">Clear Actual Logs</button>
            <p class="muted">Left = expected. Right = actual. Use refresh to pull latest logs from server.</p>
          </div>
        </div>
      </div>

      <script>
        document.getElementById('refresh').addEventListener('click', () => {
          fetch('/_raw-logs').then(r=>r.json()).then(data=>{
            document.getElementById('actual').innerText = data.join('\\n');
          });
        });
        document.getElementById('clear').addEventListener('click', () => {
          fetch('/_clear-logs', { method:'POST' }).then(()=>location.reload());
        });
      </script>

    ` + pageFooter());
  });
});

// raw logs as JSON
app.get("/_raw-logs", (req, res) => {
  res.json(actualLogs);
});

// clear logs
app.post("/_clear-logs", (req, res) => {
  actualLogs = [];
  logActual("Cleared actual logs via UI");
  res.json({ ok:true });
});

/* ---------------------------
   Optional error simulation route
   Simulated occasional 503 to test agent retry logic
----------------------------- */
app.get("/maybe-bad", (req, res) => {
  const fail = CONFIG.enableRandomObstacles && Math.random() < 0.2;
  logActual("Visited /maybe-bad (fail=" + fail + ")");
  if (fail) {
    // send a simulated server error
    res.status(503).send("503 Service Unavailable (simulated). Try again.");
  } else {
    res.send("OK");
  }
});

/* ---------------------------
   Start server
----------------------------- */
app.listen(port, () => {
  console.log(`Automation test site running at http://localhost:${port}`);
  console.log("Features: dynamic IDs, captcha, honeypot, multi-step, random delays, logs");
});
