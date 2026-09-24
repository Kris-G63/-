const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
const ambient = document.getElementById('ambient');

const activities = [
  ['🥐', '早餐'], ['🍱', '午餐'], ['🍝', '晚餐'], ['🍰', '下午茶'],
  ['☕', '咖啡'], ['🌙', '夜晚散步'], ['🍸', '小酌一杯'], ['🏸', '运动'],
  ['🎬', '看电影'], ['🎨', '看展览'], ['🌳', '公园漫步'], ['✨', 'Surprise Me']
];

const districts = ['福田区', '南山区', '罗湖区', '宝安区', '龙岗区', '龙华区', '盐田区', '光明区', '坪山区', '大鹏新区', '让 TA 决定'];

const state = {
  step: 0,
  form: {
    creator: '',
    guest: '',
    activities: [],
    customActivities: [],
    times: [blankTime(3, '下午'), blankTime(4, '晚上')],
    locations: [blankLocation()],
    message: '想和你认真地约一次会 ✨',
  },
};

function blankTime(offset = 3, label = '') {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { date, time: '', label };
}

function blankLocation() {
  return { district: '南山区', venue: '', address: '', guestDecides: false };
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function encodeData(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeData(raw) {
  try {
    let s = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const binary = atob(s);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

function makeUrl(type, data) {
  const url = new URL(location.href);
  url.hash = `${type}=${encodeData(data)}`;
  return url.toString();
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function copyText(text, msg='链接复制好啦 💗') {
  navigator.clipboard?.writeText(text).then(() => toast(msg)).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); toast(msg);
  });
}

function createAmbient() {
  const items = ['💗','💕','🌸','✨','💫','🤍'];
  ambient.innerHTML = '';
  for (let i=0;i<14;i++) {
    const el = document.createElement('span');
    el.className = 'floaty';
    el.textContent = items[i % items.length];
    el.style.left = `${4 + Math.random()*92}%`;
    el.style.top = `${2 + Math.random()*94}%`;
    el.style.fontSize = `${12 + Math.random()*12}px`;
    el.style.setProperty('--dx', `${-20 + Math.random()*40}px`);
    el.style.setProperty('--dy', `${-18 - Math.random()*34}px`);
    el.style.setProperty('--duration', `${8 + Math.random()*9}s`);
    el.style.animationDelay = `${-Math.random()*8}s`;
    ambient.appendChild(el);
  }
}

function shell(content, opts={}) {
  return `
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">💌</div>
        <div>Date Whisper<small>把见面变成一件值得期待的小事</small></div>
      </div>
      ${opts.back ? '<button class="icon-btn" data-action="home" aria-label="返回首页">←</button>' : ''}
    </div>
    ${content}
  `;
}

function renderHome() {
  app.innerHTML = shell(`
    <section class="hero-wrap">
      <div class="hero">
        <div class="envelope-orbit"><div class="envelope">💌</div></div>
        <p class="kicker">SHALL WE DATE?</p>
        <div class="hero-card">
          <h1>你收到了一份<br>约会灵感 💗</h1>
          <p>挑一件想一起做的事，再把时间和地点交给彼此选择。比“有空吗？”更可爱一点。</p>
          <div class="emoji-row"><span>🌸</span><span>☕</span><span>🎬</span><span>🌙</span></div>
        </div>
        <div class="cta-stack">
          <button class="primary" data-action="create">创建一个约会邀请 💕</button>
          <button class="secondary" data-action="demo">看看 TA 会收到什么</button>
          <div class="microcopy">无需登录 · 手机直接打开 · 链接即可分享</div>
        </div>
      </div>
    </section>
  `);
}

function renderWizard() {
  const pct = ((state.step + 1) / 5) * 100;
  let body = '';
  if (state.step === 0) body = stepPeople();
  if (state.step === 1) body = stepActivities();
  if (state.step === 2) body = stepTimes();
  if (state.step === 3) body = stepLocations();
  if (state.step === 4) body = stepPreview();

  app.innerHTML = shell(`
    <section class="wizard">
      <div class="progress-wrap"><div class="progress"><span style="--progress:${pct}%"></span></div></div>
      ${body}
    </section>
    <nav class="navbar">
      <button class="secondary" data-action="prev">${state.step === 0 ? '取消' : '上一步'}</button>
      <button class="primary" data-action="next">${state.step === 4 ? '生成邀请链接 💌' : '继续'}</button>
    </nav>
  `, {back:true});
}

function stepPeople() {
  return `
    <section class="panel">
      <div class="step-title"><span class="step-emoji">♡</span><h2>你们是谁？</h2></div>
      <p class="subtitle">TA 会在邀请卡上看到昵称。可以是真名，也可以是你们之间的小称呼。</p>
      <div class="field"><label class="label">你的昵称</label><input class="input" data-field="creator" value="${escapeHtml(state.form.creator)}" placeholder="例如：小林" maxlength="18"></div>
      <div class="field"><label class="label">TA 的昵称</label><input class="input" data-field="guest" value="${escapeHtml(state.form.guest)}" placeholder="例如：小樱" maxlength="18"></div>
    </section>
    <section class="panel">
      <div class="step-title"><span class="step-emoji">💌</span><h2>留一句话</h2></div>
      <p class="subtitle">不需要很正式。一句小小的期待，就足够让邀请变得有温度。</p>
      <div class="field"><textarea class="textarea" data-field="message" maxlength="120" placeholder="想对 TA 说……">${escapeHtml(state.form.message)}</textarea></div>
    </section>`;
}

function stepActivities() {
  const all = [...state.form.activities, ...state.form.customActivities];
  return `
    <section class="panel">
      <div class="step-title"><span class="step-emoji">🌸</span><h2>想一起做点什么？</h2></div>
      <p class="subtitle">可以多选。TA 打开邀请时会先看到这些“约会关键词”。</p>
      <div class="activity-grid">
        ${activities.map(([emoji, name]) => `<button class="choice-card ${state.form.activities.includes(name)?'selected':''}" data-activity="${escapeHtml(name)}"><span class="emoji">${emoji}</span><span>${escapeHtml(name)}</span></button>`).join('')}
      </div>
      <div class="custom-row"><input class="input" id="customActivity" placeholder="自定义：一起去逛猫咖 🐈"><button class="round-add" data-action="add-activity" aria-label="添加活动">＋</button></div>
      ${state.form.customActivities.length ? `<div class="pill-row">${state.form.customActivities.map(v=>`<span class="pill">✨ ${escapeHtml(v)} <button data-remove-custom="${escapeHtml(v)}" style="border:0;background:transparent;cursor:pointer">×</button></span>`).join('')}</div>`:''}
      <p class="subtle-note">已选择 ${all.length} 项 · 建议 2–5 项，既有方向也留一点惊喜。</p>
    </section>`;
}

function stepTimes() {
  return `
    <section class="panel">
      <div class="step-title"><span class="step-emoji">🗓️</span><h2>什么时候有空？</h2></div>
      <p class="subtitle">添加 2–5 个时间，让 TA 直接挑最方便的一个。</p>
      <div class="option-stack">
        ${state.form.times.map((t,i)=>`
          <div class="option-card">
            <div class="option-head"><strong>时间 ${i+1}</strong>${state.form.times.length>2?`<button class="remove-btn" data-remove-time="${i}">删除</button>`:''}</div>
            <div class="row-2">
              <input type="date" class="input" data-time-field="date" data-index="${i}" value="${escapeHtml(t.date)}">
              <input type="time" class="input" data-time-field="time" data-index="${i}" value="${escapeHtml(t.time)}">
            </div>
            <div class="field" style="margin-top:10px"><input class="input" data-time-field="label" data-index="${i}" value="${escapeHtml(t.label)}" placeholder="可选：下午 / 晚饭后 / 下班后"></div>
          </div>`).join('')}
      </div>
      ${state.form.times.length<5?'<button class="add-wide" data-action="add-time">再加一个时间 ✨</button>':''}
    </section>`;
}

function stepLocations() {
  return `
    <section class="panel">
      <div class="step-title"><span class="step-emoji">📍</span><h2>在哪里见面？</h2></div>
      <p class="subtitle">先定区域，也可以给几个地点让 TA 选。具体地址可以留到确认后再发。</p>
      <div class="option-stack">
        ${state.form.locations.map((l,i)=>`
          <div class="option-card">
            <div class="option-head"><strong>地点 ${i+1}</strong>${state.form.locations.length>1?`<button class="remove-btn" data-remove-location="${i}">删除</button>`:''}</div>
            <div class="row-3">
              <select class="select" data-location-field="district" data-index="${i}">${districts.map(d=>`<option ${l.district===d?'selected':''}>${d}</option>`).join('')}</select>
              <input class="input" data-location-field="venue" data-index="${i}" value="${escapeHtml(l.venue)}" placeholder="具体地方：某某咖啡 / 海岸城">
            </div>
            <div class="field" style="margin-top:10px"><input class="input" data-location-field="address" data-index="${i}" value="${escapeHtml(l.address)}" placeholder="详细地址（可选）"></div>
            <div class="toggle-row"><span>这一个地点让 TA 来决定 💕</span><label class="switch"><input type="checkbox" data-location-field="guestDecides" data-index="${i}" ${l.guestDecides?'checked':''}><span class="slider"></span></label></div>
          </div>`).join('')}
      </div>
      ${state.form.locations.length<5?'<button class="add-wide" data-action="add-location">再加一个地点 📍</button>':''}
    </section>`;
}

function formatDate(t) {
  if (!t?.date) return '待补充日期';
  const d = new Date(`${t.date}T00:00:00`);
  const wd = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
  return `${d.getMonth()+1}月${d.getDate()}日 · ${wd}${t.time?` · ${t.time}`:''}${t.label?` · ${t.label}`:''}`;
}

function locText(l) {
  if (l.guestDecides || l.district === '让 TA 决定') return '交给 TA 决定';
  return [l.district, l.venue, l.address].filter(Boolean).join(' · ') || '深圳 · 地点待定';
}

function selectedActivityLabels() {
  return [...state.form.activities, ...state.form.customActivities];
}

function stepPreview() {
  const acts = selectedActivityLabels();
  return `
    <section class="panel">
      <div class="step-title"><span class="step-emoji">💞</span><h2>最后看一眼</h2></div>
      <p class="subtitle">这就是 TA 打开链接后会收到的邀请。生成后仍然可以回来重做。</p>
      <div class="preview-card">
        <div class="preview-header">
          <div class="avatar-pair"><div class="avatar">🌷</div><div class="avatar">💗</div></div>
          <div><h3>${escapeHtml(state.form.creator || '你')} → ${escapeHtml(state.form.guest || 'TA')}</h3><small>一张只属于你们的约会邀请</small></div>
        </div>
        <div class="pill-row">${acts.length?acts.map(a=>`<span class="pill">${escapeHtml(a)}</span>`).join(''):'<span class="pill">✨ 想见面</span>'}</div>
        <div class="summary-grid">
          <div class="summary-item"><b>🗓️ 可选时间</b><span>${state.form.times.map(formatDate).join('<br>')}</span></div>
          <div class="summary-item"><b>📍 见面地点</b><span>${state.form.locations.map(locText).join('<br>')}</span></div>
          <div class="summary-item"><b>💌 想说的话</b><span>${escapeHtml(state.form.message || '期待见面。')}</span></div>
        </div>
      </div>
    </section>`;
}

function validateStep() {
  if (state.step === 0 && (!state.form.creator.trim() || !state.form.guest.trim())) return toast('先写下你们两个的昵称吧 💗'), false;
  if (state.step === 1 && selectedActivityLabels().length === 0) return toast('至少选一个想一起做的事情呀 ✨'), false;
  if (state.step === 2) {
    if (state.form.times.length < 2 || state.form.times.some(t=>!t.date)) return toast('请至少准备两个有效日期 🗓️'), false;
  }
  return true;
}

function renderGenerated() {
  const invite = { ...state.form, createdAt: Date.now(), v: 1 };
  const url = makeUrl('invite', invite);
  app.innerHTML = shell(`
    <section class="panel">
      <div class="step-title"><span class="step-emoji">💌</span><h2>邀请做好啦！</h2></div>
      <p class="subtitle">把下面这个链接发给 ${escapeHtml(invite.guest)}。对方用手机或电脑打开，都能直接看到邀请。</p>
      <div class="preview-card">
        <div class="preview-header"><div class="avatar-pair"><div class="avatar">🌷</div><div class="avatar">💗</div></div><div><h3>${escapeHtml(invite.creator)} 邀请 ${escapeHtml(invite.guest)}</h3><small>SHALL WE DATE?</small></div></div>
        <div class="pill-row">${[...invite.activities,...invite.customActivities].map(a=>`<span class="pill">${escapeHtml(a)}</span>`).join('')}</div>
        <div class="message-quote">“${escapeHtml(invite.message)}”</div>
      </div>
      <div class="share-box">
        <div class="link-box"><code>${escapeHtml(url)}</code><button class="copy-mini" data-copy="${escapeHtml(url)}">复制</button></div>
        <button class="primary" data-share="${escapeHtml(url)}">分享给 TA 💕</button>
        <button class="secondary" data-open-invite="${escapeHtml(url)}">预览邀请</button>
      </div>
      <p class="subtle-note" style="margin-top:16px">当前版本采用“链接携带邀请信息”的方式，不需要账号或数据库。TA 确认后会生成一条回复链接，发回给你即可看到选择结果。</p>
    </section>
    <div class="cta-stack"><button class="ghost" data-action="home">回到首页</button></div>
  `, {back:false});
}

function renderInvite(invite, opened=false) {
  if (!invite) return renderBrokenLink();
  if (!opened) {
    app.innerHTML = shell(`
      <section class="invite-stage closed-invite">
        <div>
          <p class="kicker">A LITTLE DATE INVITATION</p>
          <h1>${escapeHtml(invite.guest || '你')}，有一封信给你 💗</h1>
          <p>${escapeHtml(invite.creator || '某个人')} 想和你约一次会。<br>点一下，拆开看看。</p>
          <button class="envelope-button" data-action="open-envelope" aria-label="打开邀请">💌</button>
          <div class="microcopy">轻轻点一下</div>
        </div>
      </section>
    `);
    app.dataset.invite = encodeData(invite);
    return;
  }

  const acts = [...(invite.activities||[]), ...(invite.customActivities||[])];
  app.innerHTML = shell(`
    <section class="invite-stage">
      <div class="invite-card">
        <div class="love-icon">💗</div>
        <h1>${escapeHtml(invite.creator)} 想和 ${escapeHtml(invite.guest)} 约会</h1>
        <p class="lead">不用现在就把所有事都定死。挑一个最舒服的时间，再选一个想去的地方就好。</p>
        <div class="pill-row" style="justify-content:center">${acts.map(a=>`<span class="pill">${escapeHtml(a)}</span>`).join('')}</div>
        ${invite.message?`<div class="message-quote">“${escapeHtml(invite.message)}”</div>`:''}
        <div class="section-label">🗓️ 挑一个你方便的时间</div>
        <div class="guest-option-grid">${(invite.times||[]).map((t,i)=>`<button class="guest-choice" data-guest-time="${i}"><b>${formatDate(t)}</b><small>${t.label ? '这个时间的暗号：'+escapeHtml(t.label) : '如果这个时间合适，就选它吧'}</small></button>`).join('')}</div>
        <div class="section-label">📍 选一个见面地点</div>
        <div class="guest-option-grid">${(invite.locations||[]).map((l,i)=>`<button class="guest-choice" data-guest-location="${i}"><b>${escapeHtml(locText(l))}</b><small>${l.guestDecides ? '你可以在下面补充一个你更想去的地方' : '选这个地点'}</small></button>`).join('')}</div>
        <div class="response-area"><input class="input" id="guestPlace" placeholder="如果地点交给你：可以写一个你想去的地方"></div>
        <div class="response-area"><textarea class="textarea" id="guestNote" placeholder="想回一句什么？（可选）"></textarea></div>
        <button class="primary" style="width:100%;margin-top:12px" data-action="confirm-invite">确认这次约会 💞</button>
        <p class="subtle-note" style="text-align:center;margin-top:12px">你的选择会生成一条回复链接，发回给 ${escapeHtml(invite.creator)} 即可。</p>
      </div>
    </section>
  `);
  app.dataset.invite = encodeData(invite);
  app.dataset.guestTime = '';
  app.dataset.guestLocation = '';
}

function renderResponse(data) {
  if (!data?.invite) return renderBrokenLink();
  const invite = data.invite;
  const t = invite.times?.[data.timeIndex];
  const l = invite.locations?.[data.locationIndex];
  app.innerHTML = shell(`
    <section class="invite-stage">
      <div class="invite-card celebrate">
        <div class="big-heart">💗</div>
        <p class="kicker">DATE CONFIRMED</p>
        <h1>${escapeHtml(invite.guest)} 回复啦！</h1>
        <p>你们的约会已经有了一个很具体的小轮廓。</p>
        <div class="summary-grid" style="text-align:left;margin-top:24px">
          <div class="summary-item"><b>🗓️ TA 选择的时间</b><span>${formatDate(t)}</span></div>
          <div class="summary-item"><b>📍 TA 选择的地点</b><span>${escapeHtml(l ? locText(l) : '待定')}${data.guestPlace ? `<br>TA 补充：${escapeHtml(data.guestPlace)}` : ''}</span></div>
          ${data.note ? `<div class="summary-item"><b>💌 TA 想对你说</b><span>${escapeHtml(data.note)}</span></div>` : ''}
        </div>
        <div class="share-box">
          <button class="primary" data-action="calendar">加入日历 🗓️</button>
          <button class="secondary" data-action="home">再做一个邀请</button>
        </div>
      </div>
    </section>
  `);
  app.dataset.response = encodeData(data);
  burstConfetti();
}

function renderConfirmed(invite, response) {
  const responseUrl = makeUrl('response', response);
  app.innerHTML = shell(`
    <section class="invite-stage">
      <div class="invite-card celebrate">
        <div class="big-heart">💗</div>
        <p class="kicker">IT'S A DATE</p>
        <h1>约会确定啦！</h1>
        <p>把回复链接发回给 ${escapeHtml(invite.creator)}，TA 就能看到你的选择。</p>
        <div class="share-box" style="text-align:left">
          <div class="link-box"><code>${escapeHtml(responseUrl)}</code><button class="copy-mini" data-copy="${escapeHtml(responseUrl)}">复制</button></div>
          <button class="primary" data-share="${escapeHtml(responseUrl)}">把选择发回去 💌</button>
        </div>
      </div>
    </section>
  `);
  burstConfetti();
}

function renderBrokenLink() {
  app.innerHTML = shell(`<section class="panel"><h2>这张邀请卡没有找到 🥺</h2><p class="subtitle">链接可能被截断了。请让对方重新复制完整链接给你。</p><button class="primary" style="width:100%" data-action="home">返回首页</button></section>`);
}

function burstConfetti() {
  const colors = ['#ff8dab','#ffc0cf','#ffd783','#cbbbf2','#ffb3c5'];
  for (let i=0;i<36;i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = `${Math.random()*100}vw`;
    p.style.top = `${-20 - Math.random()*100}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--x', `${-80 + Math.random()*160}px`);
    p.style.animationDelay = `${Math.random()*.7}s`;
    document.body.appendChild(p);
    setTimeout(()=>p.remove(), 3400);
  }
}

function downloadCalendar(data) {
  const invite = data.invite;
  const t = invite.times?.[data.timeIndex];
  if (!t?.date) return toast('这个时间还不够完整，暂时不能加入日历');
  const start = new Date(`${t.date}T${t.time || '12:00'}:00`);
  const end = new Date(start.getTime()+2*60*60*1000);
  const stamp = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
  const location = data.guestPlace || locText(invite.locations?.[data.locationIndex] || {});
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Date Whisper//CN','BEGIN:VEVENT',
    `DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,
    `SUMMARY:${invite.creator} × ${invite.guest} 的约会`,
    `LOCATION:${location.replace(/[,;]/g,' ')}`,
    `DESCRIPTION:${(invite.message||'').replace(/\n/g,' ').replace(/[,;]/g,' ')}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'date-whisper.ics'; a.click(); URL.revokeObjectURL(a.href);
}

function demoInvite() {
  return {
    creator:'小林', guest:'小樱',
    activities:['咖啡','看电影','公园漫步'], customActivities:[],
    times:[blankTime(3,'下午'), blankTime(5,'晚饭后')],
    locations:[{district:'南山区',venue:'海岸城附近',address:'',guestDecides:false},{district:'福田区',venue:'某家安静的咖啡店',address:'',guestDecides:true}],
    message:'想和你认真地约一次会，也想看看那天的你会不会比平时更可爱一点。', v:1
  };
}

app.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.field) state.form[el.dataset.field] = el.value;
  if (el.dataset.timeField) state.form.times[+el.dataset.index][el.dataset.timeField] = el.value;
  if (el.dataset.locationField) {
    const key = el.dataset.locationField;
    state.form.locations[+el.dataset.index][key] = key === 'guestDecides' ? el.checked : el.value;
  }
});

app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.locationField) {
    const key = el.dataset.locationField;
    state.form.locations[+el.dataset.index][key] = key === 'guestDecides' ? el.checked : el.value;
  }
});

app.addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.dataset.action === 'home') { history.replaceState(null,'',location.pathname+location.search); state.step=0; renderHome(); window.scrollTo(0,0); }
  if (t.dataset.action === 'create') { state.step=0; renderWizard(); window.scrollTo(0,0); }
  if (t.dataset.action === 'demo') { renderInvite(demoInvite(), false); window.scrollTo(0,0); }

  if (t.dataset.action === 'prev') {
    if (state.step===0) return renderHome();
    state.step--; renderWizard(); window.scrollTo(0,0);
  }
  if (t.dataset.action === 'next') {
    if (!validateStep()) return;
    if (state.step<4) { state.step++; renderWizard(); window.scrollTo(0,0); }
    else renderGenerated();
  }

  if (t.dataset.activity) {
    const name = t.dataset.activity;
    const i = state.form.activities.indexOf(name);
    i>=0 ? state.form.activities.splice(i,1) : state.form.activities.push(name);
    renderWizard();
  }
  if (t.dataset.action === 'add-activity') {
    const input = document.getElementById('customActivity');
    const v = input?.value.trim();
    if (v && !state.form.customActivities.includes(v)) state.form.customActivities.push(v);
    renderWizard();
  }
  if (t.dataset.removeCustom) { state.form.customActivities = state.form.customActivities.filter(v=>v!==t.dataset.removeCustom); renderWizard(); }

  if (t.dataset.action === 'add-time') { if (state.form.times.length<5) state.form.times.push(blankTime(3+state.form.times.length, '')); renderWizard(); }
  if (t.dataset.removeTime != null) { state.form.times.splice(+t.dataset.removeTime,1); renderWizard(); }
  if (t.dataset.action === 'add-location') { if (state.form.locations.length<5) state.form.locations.push(blankLocation()); renderWizard(); }
  if (t.dataset.removeLocation != null) { state.form.locations.splice(+t.dataset.removeLocation,1); renderWizard(); }

  if (t.dataset.copy) copyText(t.dataset.copy);
  if (t.dataset.share) {
    const shareUrl = t.dataset.share;
    if (navigator.share) {
      try { await navigator.share({title:'Date Whisper · 约会邀请', text:'有一封约会邀请想给你 💌', url:shareUrl}); }
      catch {}
    } else copyText(shareUrl);
  }
  if (t.dataset.openInvite) { location.assign(t.dataset.openInvite); }

  if (t.dataset.action === 'open-envelope') {
    const invite = decodeData(app.dataset.invite || '');
    renderInvite(invite, true); window.scrollTo(0,0);
    burstConfetti();
  }
  if (t.dataset.guestTime != null) {
    app.dataset.guestTime = t.dataset.guestTime;
    app.querySelectorAll('[data-guest-time]').forEach(x=>x.classList.toggle('selected',x===t));
  }
  if (t.dataset.guestLocation != null) {
    app.dataset.guestLocation = t.dataset.guestLocation;
    app.querySelectorAll('[data-guest-location]').forEach(x=>x.classList.toggle('selected',x===t));
  }
  if (t.dataset.action === 'confirm-invite') {
    const invite = decodeData(app.dataset.invite || '');
    const timeIndex = Number(app.dataset.guestTime);
    const locationIndex = Number(app.dataset.guestLocation);
    if (app.dataset.guestTime === '' || app.dataset.guestLocation === '') return toast('先选一个时间和地点吧 💗');
    const response = { invite, timeIndex, locationIndex, guestPlace: document.getElementById('guestPlace')?.value.trim() || '', note: document.getElementById('guestNote')?.value.trim() || '', repliedAt:Date.now(), v:1 };
    renderConfirmed(invite, response);
  }
  if (t.dataset.action === 'calendar') {
    const data = decodeData(app.dataset.response || '');
    if (data) downloadCalendar(data);
  }
});

function route() {
  const hash = location.hash.slice(1);
  if (!hash) return renderHome();
  if (hash.startsWith('invite=')) return renderInvite(decodeData(hash.slice(7)), false);
  if (hash.startsWith('response=')) return renderResponse(decodeData(hash.slice(9)));
  renderHome();
}

window.addEventListener('hashchange', route);
createAmbient();
route();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
