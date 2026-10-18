/* ==========================================================================
   SITE CONFIGURATION: edit these values before launch
   ========================================================================== */
const CONFIG = {
  brand: 'Apex Visa & Education Consultants',
  whatsappNumber: '923000000000',   // international format, digits only
  formEndpoint: '',                  // optional: POST URL (Formspree, Make, Zapier, your API). Leave '' to use WhatsApp handoff only.
  consultantResponseHours: 24
};

/* ==========================================================================
   UTILITIES
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const wait = ms => new Promise(res => setTimeout(res, ms));
const PK_PHONE = /^(?:\+92|0092|92|0)?3\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanPhone = v => String(v).replace(/[\s\-()]/g, '');

function buildWhatsAppLink(text) {
  return 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(text);
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */
(function initNav() {
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const links = $('#navLinks');

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setOpen = open => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 920) setOpen(false); });
  $('#year').textContent = new Date().getFullYear();
})();

/* ==========================================================================
   REVEAL ON SCROLL, COUNTERS, HERO BARS
   ========================================================================== */
(function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement.children).filter(c => c.classList.contains('reveal'));
        const idx = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(idx * 70, 280) + 'ms';
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
})();

(function initCounters() {
  const nums = $$('[data-count]');
  const animate = el => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (target === 0) { el.textContent = '0' + suffix; return; }
    const duration = 1800;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!('IntersectionObserver' in window)) { nums.forEach(animate); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); } });
  }, { threshold: 0.6 });
  nums.forEach(n => io.observe(n));
})();

(function initHeroBars() {
  const bars = $$('.bar i[data-w]');
  setTimeout(() => bars.forEach(b => { b.style.width = b.dataset.w + '%'; }), 500);
})();

/* ==========================================================================
   ELIGIBILITY WIZARD
   ========================================================================== */
(function initWizard() {
  const QUAL = {
    fsc:       { label: 'FSc / Intermediate', pts: 18, level: 'UG' },
    alevels:   { label: 'A-Levels',           pts: 22, level: 'UG' },
    bachelors: { label: 'Bachelors',          pts: 28, level: 'PG' },
    masters:   { label: 'Masters',            pts: 30, level: 'PG' }
  };
  const IELTS = {
    below6: { label: 'IELTS below 6.0', pts: 6 },
    '6.0':  { label: 'IELTS 6.0',       pts: 20 },
    '6.5':  { label: 'IELTS 6.5',       pts: 32 },
    '7.0':  { label: 'IELTS 7.0+',      pts: 40 }
  };
  const COUNTRY = {
    germany:   { label: 'Germany',        flag: '🇩🇪', fit: { fsc: -6, alevels: 0, bachelors: 8, masters: 10 }, timeline: '3 to 5 months (admission + visa)' },
    uk:        { label: 'United Kingdom', flag: '🇬🇧', fit: { fsc: -2, alevels: 6, bachelors: 6, masters: 8 },  timeline: '3 to 6 months (CAS + visa ~3 weeks)' },
    canada:    { label: 'Canada',         flag: '🇨🇦', fit: { fsc: 0,  alevels: 4, bachelors: 4, masters: 6 },  timeline: '4 to 7 months (study permit 8 to 14 weeks)' },
    australia: { label: 'Australia',      flag: '🇦🇺', fit: { fsc: 0,  alevels: 4, bachelors: 5, masters: 6 },  timeline: '3 to 6 months (visa 4 to 8 weeks)' }
  };
  const SCHOLARSHIPS = {
    germany: {
      UG: ['DAAD study-preparation and foundation support (eligibility varies)', 'Deutschlandstipendium (merit award once enrolled)', 'Tuition-free admission at most public universities'],
      PG: ['DAAD Master\'s scholarships (competitive, early application advised)', 'Deutschlandstipendium (merit award once enrolled)', 'Tuition-free English-taught Masters at most public universities']
    },
    uk: {
      UG: ['University merit and international excellence awards', 'GREAT-style and regional scholarships (subject to availability)', 'Undergraduate fee discounts for early offers'],
      PG: ['Chevening Scholarships (fully funded, highly competitive)', 'Commonwealth Shared Scholarships for eligible applicants', 'University international merit awards']
    },
    canada: {
      UG: ['University entrance scholarships (merit-based, automatic at many schools)', 'Lester B. Pearson International Scholarship (University of Toronto)', 'Provincial and departmental bursaries'],
      PG: ['Graduate research assistantships and funding packages', 'University international graduate awards', 'Department-level scholarships for research programs']
    },
    australia: {
      UG: ['University international merit scholarships', 'Destination Australia (regional study, eligibility applies)', 'Fee reductions at partner institutions'],
      PG: ['Australia Awards (government-funded, eligibility applies)', 'University postgraduate merit scholarships', 'Research Training Program stipends for research degrees']
    }
  };

  const state = { qualification: null, ielts: null, country: null };
  let step = 1;
  let lastPayload = null;

  const flow = $('#wizardFlow'), analyzing = $('#analyzing'), result = $('#result');
  const nextBtn = $('#wizNext'), backBtn = $('#wizBack'), errBox = $('#stepError'), progress = $('#wizProgress');
  const stepEls = $$('.step'), indicators = $$('.si');

  function paint() {
    stepEls.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === step));
    indicators.forEach(si => {
      const n = Number(si.dataset.si);
      si.classList.toggle('active', n === step);
      si.classList.toggle('done', n < step);
      const dot = $('.dot', si);
      dot.textContent = n < step ? '✓' : String(n);
    });
    progress.style.width = (step / 3 * 100) + '%';
    progress.parentElement.setAttribute('aria-valuenow', String(step));
    backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    nextBtn.textContent = step === 3 ? 'Analyze Eligibility ✨' : 'Continue →';
    nextBtn.className = step === 3 ? 'btn btn-gold btn-lg' : 'btn btn-primary';
    errBox.textContent = '';
    syncNext();
  }

  const currentKey = () => ['qualification', 'ielts', 'country'][step - 1];
  function syncNext() { nextBtn.disabled = !state[currentKey()]; }

  $$('.options').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.opt');
      if (!btn) return;
      $$('.opt', group).forEach(o => o.classList.remove('selected'));
      btn.classList.add('selected');
      state[group.dataset.key] = btn.dataset.value;
      errBox.textContent = '';
      syncNext();
    });
  });

  nextBtn.addEventListener('click', () => {
    if (!state[currentKey()]) { errBox.textContent = 'Please select an option to continue.'; return; }
    if (step < 3) { step += 1; paint(); return; }
    runAnalysis();
  });
  backBtn.addEventListener('click', () => { if (step > 1) { step -= 1; paint(); } });

  function computeScore() {
    const q = QUAL[state.qualification], i = IELTS[state.ielts], c = COUNTRY[state.country];
    const raw = 15 + q.pts + i.pts + c.fit[state.qualification];
    return Math.max(25, Math.min(96, raw));
  }

  function verdictFor(score) {
    if (score >= 75) return { cls: 'high', badge: '🟢 High Success Chance', title: 'Excellent profile for a strong visa case', };
    if (score >= 55) return { cls: 'medium', badge: '🟡 Medium: Improvement Needed', title: 'Good foundation, with a few gaps worth closing', };
    return { cls: 'low', badge: '🟠 Needs Preparation', title: 'Achievable with the right pathway and preparation' };
  }

  function buildPlan() {
    const q = state.qualification, b = state.ielts, c = state.country;
    const plan = [];
    if (b === 'below6') plan.push('Raise your IELTS to at least 6.0 to 6.5 first. Our band-guarantee batch is built for exactly this gap.');
    else if (b === '6.0') plan.push('Aim for 6.5 overall if possible. It unlocks more programs and strengthens your visa file.');
    else if (b === '6.5') plan.push('Your band is competitive. Keep each sub-score at 6.0 or above to avoid program restrictions.');
    else plan.push('Your band is a major strength. Use it to target top-ranked public universities and merit awards.');

    if (c === 'germany') {
      if (q === 'fsc') plan.push('Direct entry is usually not possible with FSc alone. We will plan a Studienkolleg or foundation pathway.');
      else plan.push('Apply to English-taught programs at public universities and complete APS certificate verification early.');
      plan.push('Prepare your blocked account and health insurance documents before booking the visa appointment.');
    } else if (c === 'uk') {
      plan.push('Secure your CAS from the university, then prepare proof of funds held for the required period.');
      plan.push('Apply early. Many UK courses fill up and scholarships close before the visa stage.');
    } else if (c === 'canada') {
      plan.push('Choose a Designated Learning Institution and prepare proof of funds, including the GIC where required.');
      plan.push('Write a clear, consistent study plan. It is the most common point of weakness in Canadian study permit files.');
    } else {
      plan.push('Prepare your Genuine Student statement and arrange OSHC health cover with your offer.');
      plan.push('Show clear financial capacity and a coherent academic progression in your application.');
    }
    plan.push('Indicative timeline: ' + COUNTRY[c].timeline + '.');
    return plan;
  }

  async function runAnalysis() {
    flow.style.display = 'none';
    analyzing.classList.add('show');
    const msgs = ['Reading your academic profile…', 'Checking IELTS requirements…', 'Matching ' + COUNTRY[state.country].label + ' pathways and scholarships…', 'Calculating your readiness score…'];
    const text = $('#analyzingText');
    for (const m of msgs) { text.textContent = m; await wait(520); }
    analyzing.classList.remove('show');
    renderResult();
  }

  function renderResult() {
    const score = computeScore();
    const v = verdictFor(score);
    const q = QUAL[state.qualification], i = IELTS[state.ielts], c = COUNTRY[state.country];

    const verdictEl = $('#verdict');
    verdictEl.className = 'verdict ' + v.cls;
    verdictEl.textContent = v.badge;
    $('#resTitle').textContent = v.title;
    $('#resSummary').textContent = 'Based on your ' + q.label + ' background and ' + i.label.toLowerCase() + ', your estimated readiness for ' + c.label + ' is ' + score + ' out of 100. This is an indicative estimate that a counsellor will refine with your documents.';

    const chips = $('#resChips');
    chips.innerHTML = '';
    [q.label, i.label, c.flag + ' ' + c.label].forEach(t => {
      const s = document.createElement('span'); s.className = 'chip'; s.textContent = t; chips.appendChild(s);
    });

    const fillList = (id, items) => {
      const ul = $(id); ul.innerHTML = '';
      items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    };
    fillList('#resPlan', buildPlan());
    fillList('#resSchol', SCHOLARSHIPS[state.country][q.level]);

    $('#leadSub').textContent = 'Your ' + c.label + ' Blueprint Pack includes a university shortlist for ' + q.label + ' applicants, a document checklist, funding guidance and a month-by-month timeline.';
    $('#leadForm').style.display = '';
    $('#leadSuccess').classList.remove('show');

    result.classList.add('show');
    const meter = $('#ringMeter');
    const circ = 2 * Math.PI * 54;
    meter.style.strokeDasharray = String(circ);
    meter.style.strokeDashoffset = String(circ);
    requestAnimationFrame(() => requestAnimationFrame(() => { meter.style.strokeDashoffset = String(circ * (1 - score / 100)); }));

    const scoreEl = $('#scoreNum');
    const t0 = performance.now();
    const count = now => {
      const p = Math.min((now - t0) / 1600, 1);
      scoreEl.textContent = Math.round(score * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);

    lastPayload = { score, verdict: v.badge.replace(/^[^\w]+/, ''), qualification: q.label, ielts: i.label, country: c.label };
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Lead form ---------- */
  const form = $('#leadForm');
  const setInvalid = (input, bad) => input.closest('.field').classList.toggle('invalid', bad);
  $$('input, select', form).forEach(el => el.addEventListener('input', () => setInvalid(el, false)));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#lfName'), phone = $('#lfPhone'), email = $('#lfEmail'), city = $('#lfCity');
    const bad = {
      name: name.value.trim().length < 2,
      phone: !PK_PHONE.test(cleanPhone(phone.value)),
      email: email.value.trim() !== '' && !EMAIL.test(email.value.trim()),
      city: !city.value
    };
    setInvalid(name, bad.name); setInvalid(phone, bad.phone); setInvalid(email, bad.email); setInvalid(city, bad.city);
    if (Object.values(bad).some(Boolean)) {
      const first = $('.field.invalid input, .field.invalid select', form);
      if (first) first.focus();
      return;
    }

    const btn = $('#leadSubmit');
    btn.disabled = true; btn.textContent = 'Sending…';

    const payload = Object.assign({
      source: 'eligibility-wizard',
      submittedAt: new Date().toISOString(),
      name: name.value.trim(),
      phone: cleanPhone(phone.value),
      email: email.value.trim(),
      city: city.value
    }, lastPayload);

    let delivered = false;
    if (CONFIG.formEndpoint) {
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        delivered = res.ok;
      } catch (err) { delivered = false; }
    }
    await wait(500);

    const wa = 'Hello ' + CONFIG.brand + ', I just completed the eligibility check. Name: ' + payload.name +
      '. Profile: ' + payload.qualification + ', ' + payload.ielts + ', ' + payload.country +
      '. Readiness score: ' + payload.score + '/100. Please share my Blueprint Pack.';
    $('#waLink').href = buildWhatsAppLink(wa);

    $('#successTitle').textContent = 'Thank you, ' + payload.name.split(' ')[0] + '!';
    $('#successText').textContent = CONFIG.formEndpoint && !delivered
      ? 'We could not reach our server just now. Tap the button below to send your details on WhatsApp and we will reply fast.'
      : 'Your ' + payload.country + ' Blueprint Pack request is in. A senior counsellor will contact you within ' + CONFIG.consultantResponseHours + ' hours. For a faster response, continue on WhatsApp.';

    form.style.display = 'none';
    $('#leadSuccess').classList.add('show');
    btn.disabled = false; btn.textContent = 'Send My Blueprint Pack →';
  });

  $('#wizRestart').addEventListener('click', () => {
    state.qualification = state.ielts = state.country = null;
    step = 1;
    $$('.opt').forEach(o => o.classList.remove('selected'));
    form.reset();
    $$('.field', form).forEach(f => f.classList.remove('invalid'));
    result.classList.remove('show');
    flow.style.display = '';
    paint();
    $('#assessment').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  paint();
})();

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
(function initFaq() {
  const items = $$('.faq-item');
  const setHeight = item => {
    const panel = $('.faq-a', item);
    panel.style.height = item.classList.contains('open') ? panel.firstElementChild.scrollHeight + 'px' : '0px';
  };
  items.forEach(item => {
    const btn = $('.faq-q', item);
    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      items.forEach(other => {
        other.classList.remove('open');
        $('.faq-q', other).setAttribute('aria-expanded', 'false');
        setHeight(other);
      });
      if (willOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        setHeight(item);
      }
    });
  });
  window.addEventListener('resize', () => items.forEach(setHeight));
})();

/* ==========================================================================
   APEX SMART CHAT ASSISTANT
   ========================================================================== */
(function initChat() {
  const fab = $('#chatToggle'), panel = $('#chatPanel'), body = $('#chatBody'), form = $('#chatForm');
  const input = $('#chatInput'), closeBtn = $('#chatClose'), hint = $('#chatHint'), quick = $('#chatQuick');

  const ctx = { greeted: false, awaitingPhone: false, awaitingIelts: false, topic: null, busy: false };

  const scrollDown = () => { body.scrollTop = body.scrollHeight; };

  function addMessage(role, content, isHtml) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    if (isHtml) el.innerHTML = content; else el.textContent = content;
    body.appendChild(el);
    scrollDown();
    return el;
  }

  async function botReply(html) {
    ctx.busy = true;
    const dots = document.createElement('div');
    dots.className = 'typing';
    dots.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(dots);
    scrollDown();
    await wait(550 + Math.min(html.length * 1.6, 650));
    dots.remove();
    addMessage('bot', html, true);
    ctx.busy = false;
  }

  const R = {
    welcome: '👋 Welcome to <strong>Apex Visa &amp; Education</strong>! I can help with <strong>Germany, UK, Canada, Australia</strong> and IELTS. Which destination interests you?',
    germany: '🇩🇪 <strong>Studying in Germany: key facts</strong><ul>' +
      '<li><span><strong>Free tuition</strong> at most public universities, with only a semester contribution</span></li>' +
      '<li><span><strong>Blocked account</strong> of roughly €11,900 per year is required for the visa (we confirm the latest figure)</span></li>' +
      '<li><span><strong>APS certificate</strong> verification is required for Pakistani applicants</span></li>' +
      '<li><span>FSc holders usually enter via a <strong>Studienkolleg</strong> foundation year</span></li></ul>' +
      '<div class="cta-line">📱 Share your active mobile number and a counsellor will send your custom Germany blueprint.</div>',
    uk: '🇬🇧 <strong>UK intakes &amp; criteria</strong><ul>' +
      '<li><span>Main intakes: <strong>September</strong> and <strong>January</strong>, with some courses in May</span></li>' +
      '<li><span>Typical IELTS: <strong>6.0 to 6.5</strong> overall for most programs</span></li>' +
      '<li><span>You need a <strong>CAS</strong> and proof of funds held for the required period</span></li></ul>' +
      '<div class="cta-line">📝 What IELTS score do you have, or expect? Reply with a number such as 6.5.</div>',
    canada: '🇨🇦 <strong>Canada intakes &amp; criteria</strong><ul>' +
      '<li><span>Main intakes: <strong>September</strong>, <strong>January</strong> and <strong>May</strong></span></li>' +
      '<li><span>Typical IELTS: <strong>6.0 to 6.5</strong> overall, with sub-score minimums</span></li>' +
      '<li><span>A study permit needs a Designated Learning Institution offer and proof of funds</span></li></ul>' +
      '<div class="cta-line">📝 What IELTS score do you have, or expect? Reply with a number such as 6.5.</div>',
    australia: '🇦🇺 <strong>Australia: key facts</strong><ul>' +
      '<li><span>Intakes: <strong>February</strong> and <strong>July</strong>, with others at some universities</span></li>' +
      '<li><span>Typical IELTS: <strong>6.0 to 6.5</strong>, depending on the course</span></li>' +
      '<li><span>You need <strong>OSHC</strong> cover and must meet the Genuine Student requirement</span></li></ul>' +
      '<div class="cta-line">📝 What IELTS score do you have, or expect? Reply with a number such as 6.5.</div>',
    ielts: '📝 <strong>IELTS coaching at Apex</strong><ul>' +
      '<li><span>Small batches with <strong>weekly full mock tests</strong></span></li>' +
      '<li><span>One-to-one speaking feedback from certified trainers</span></li>' +
      '<li><span><strong>Band guarantee</strong> program (terms apply)</span></li></ul>' +
      'What band do you need? Tell me a score and I will suggest a plan.',
    fees: '💰 We use a <strong>fixed, written fee structure</strong> shared before you sign, with <strong>zero hidden charges</strong>. University, embassy and blocked-account payments go directly to those institutions.<div class="cta-line">Want exact numbers? Share your mobile number and we will call you back.</div>',
    visa: '🛂 No consultant can promise a visa, but we remove the avoidable refusal risks: document audits, financial structuring, SOP consistency and <strong>mock visa interviews</strong>. Our clients enjoy a <strong>98% success rate</strong>.<div class="cta-line">Try the <a href="#assessment" style="text-decoration:underline">free eligibility check</a> or share your mobile number for a callback.</div>',
    callback: '📞 Happy to arrange that! Please type your <strong>mobile number</strong> (for example 03XX XXXXXXX) and a senior counsellor will call you.',
    fallback: '🙏 Thanks for your message. Every profile is different, and our advisors have helped <strong>5,000+ students</strong> reach their universities with a transparent, no-stress process.<div class="cta-line">Type your mobile number and I will request a <strong>free callback</strong>, or ask me about Germany, UK, Canada or IELTS.</div>'
  };

  function ieltsAdvice(score) {
    const dest = ctx.topic === 'canada' ? 'Canada' : ctx.topic === 'australia' ? 'Australia' : 'the UK';
    if (score >= 7) return '🚀 <strong>IELTS ' + score.toFixed(1) + '</strong> is excellent for ' + dest + '. You can target top public universities and merit scholarships.<div class="cta-line">Share your mobile number to get a personalised shortlist.</div>';
    if (score >= 6.5) return '✅ <strong>IELTS ' + score.toFixed(1) + '</strong> meets most program requirements for ' + dest + '. Make sure each sub-score is at least 6.0.<div class="cta-line">Share your mobile number for a free profile review.</div>';
    if (score >= 6) return '🟡 <strong>IELTS ' + score.toFixed(1) + '</strong> works for some programs in ' + dest + ', but a 6.5 would open many more options.<div class="cta-line">Our band-guarantee class can help. Share your mobile number to book a free demo.</div>';
    return '📈 <strong>IELTS ' + score.toFixed(1) + '</strong> is below most minimums for ' + dest + ', but it is very fixable. Our band-guarantee batch typically targets a 1.0 to 1.5 band jump.<div class="cta-line">Share your mobile number to book a free demo class.</div>';
  }

  function route(raw) {
    const text = raw.toLowerCase();
    const digits = raw.replace(/[^\d+]/g, '');

    if (PK_PHONE.test(cleanPhone(raw)) || (ctx.awaitingPhone && digits.length >= 10)) {
      ctx.awaitingPhone = false;
      return '✅ Thank you! We saved <strong>' + raw.trim().replace(/</g, '&lt;') + '</strong>. A senior counsellor will contact you within ' + CONFIG.consultantResponseHours + ' hours with your custom blueprint. You can also <a href="' + buildWhatsAppLink('Hello ' + CONFIG.brand + ', I would like a callback.') + '" target="_blank" rel="noopener" style="text-decoration:underline">message us on WhatsApp</a> for a faster reply.';
    }

    if (ctx.awaitingIelts) {
      const m = text.match(/\b([4-9](?:\.[05])?)\b/);
      if (m) { ctx.awaitingIelts = false; return ieltsAdvice(parseFloat(m[1])); }
    }

    if (/\b(germany|german|deutschland|free|tuition)\b/.test(text)) { ctx.topic = 'germany'; ctx.awaitingPhone = true; ctx.awaitingIelts = false; return R.germany; }
    if (/\b(uk|u\.k|united kingdom|britain|england|london)\b/.test(text)) { ctx.topic = 'uk'; ctx.awaitingIelts = true; return R.uk; }
    if (/\b(canada|canadian|toronto)\b/.test(text)) { ctx.topic = 'canada'; ctx.awaitingIelts = true; return R.canada; }
    if (/\b(australia|australian|sydney|melbourne)\b/.test(text)) { ctx.topic = 'australia'; ctx.awaitingIelts = true; return R.australia; }
    if (/\b(ielts|band|pte|english test|language)\b/.test(text)) { ctx.awaitingIelts = true; ctx.topic = ctx.topic || 'uk'; return R.ielts; }
    if (/\b(fee|fees|cost|price|charges|charge|expensive|payment)\b/.test(text)) { ctx.awaitingPhone = true; return R.fees; }
    if (/\b(visa|reject|rejection|refusal|refused|interview)\b/.test(text)) { ctx.awaitingPhone = true; return R.visa; }
    if (/\b(call|callback|call back|contact|phone|number|talk|consult)\b/.test(text)) { ctx.awaitingPhone = true; return R.callback; }
    if (/\b(hi|hello|hey|salam|assalam|aoa|good morning|good evening)\b/.test(text)) return R.welcome;
    if (/\b(thanks|thank you|shukriya|jazak)\b/.test(text)) return 'You are most welcome! 😊 Anything else about Germany, UK, Canada, Australia or IELTS?';

    ctx.awaitingPhone = true;
    return R.fallback;
  }

  async function handleUserText(text) {
    const clean = text.trim();
    if (!clean || ctx.busy) return;
    addMessage('user', clean, false);
    await botReply(route(clean));
  }

  function openChat() {
    panel.classList.add('open');
    fab.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    fab.setAttribute('aria-label', 'Close chat');
    hint.classList.remove('show');
    if (!ctx.greeted) {
      ctx.greeted = true;
      botReply(R.welcome);
    }
    setTimeout(() => { input.focus({ preventScroll: true }); scrollDown(); }, 250);
  }
  function closeChat() {
    panel.classList.remove('open');
    fab.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-label', 'Open Apex Smart Assistant chat');
  }

  fab.addEventListener('click', () => (panel.classList.contains('open') ? closeChat() : openChat()));
  closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) closeChat(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    handleUserText(value);
  });
  quick.addEventListener('click', e => {
    const btn = e.target.closest('button[data-q]');
    if (btn) handleUserText(btn.dataset.q);
  });

  setTimeout(() => { if (!panel.classList.contains('open')) hint.classList.add('show'); }, 6000);
  setTimeout(() => hint.classList.remove('show'), 14000);
})();
