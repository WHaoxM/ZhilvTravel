const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../assets/js/wenshu-contact.js'), 'utf8');
function setup(fetch) {
  const window = { WENSHU_LEAD_CONFIG: { endpoint: 'https://www.xuntingtravel.com/api/wenshu?action=lead' } };
  vm.runInNewContext(code, { window, document: { documentElement: { lang: 'zh' } }, fetch,
    crypto, URL, AbortController, setTimeout, clearTimeout,
    location: { origin: 'https://wenshuzhilv.kaifa2-xtch2026.chatgpt.site', pathname: '/' } });
  return window.WenshuContact;
}
const form = { name: '测试', phone: '13800000000', company: '本地测试公司', companyAddress: '成都测试地址', businessType: '地接社', source: 'modal' };
test('address required before network request', async () => {
  const api = setup(() => { throw new Error('Must not send'); });
  await assert.rejects(api.submitLead({ ...form, companyAddress: '' }), /公司地址/);
});

test('closed chat opens the offline lead without reopening IM', async () => {
  function element() {
    const classes = new Set(), attrs = {};
    return { handlers: {}, children: [], style: {}, value: '', textContent: '', hidden: false, disabled: false,
      className: '', scrollHeight: 0, scrollTop: 0,
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(el) { this.children.push(el); }, replaceChildren() { this.children = []; },
      setAttribute(name, value) { attrs[name] = value; }, getAttribute(name) { return attrs[name] || null; },
      focus() {}, reset() { this.value = ''; }
    };
  }
  const ids = ['chatPanel', 'chatFab', 'chatBody', 'chatInput', 'chatSend', 'chatClose', 'chatChips', 'chatEnded',
    'chatToolHint', 'chatSpeaker', 'chatContinue', 'chatLeave', 'chatLeaveMask', 'chatLeaveClose', 'chatLeaveForm',
    'leaveMessage', 'leaveName', 'leavePhone', 'leaveEmail', 'leaveAddress', 'chatLeaveFeedback'];
  const nodes = Object.fromEntries(ids.map(id => [id, element()]));
  const status = element(), welcome = element(), submit = element();
  nodes.chatPanel.querySelector = selector => selector === '.cp-welcome' ? welcome : selector === '.cp-head div span' ? status : selector === 'button[type="submit"]' ? submit : element();
  nodes.chatPanel.querySelectorAll = () => [];
  nodes.chatLeaveForm.querySelector = () => submit;
  const document = { documentElement: { lang: 'zh' }, hidden: false,
    getElementById: id => nodes[id], createElement: element, addEventListener() {} };
  const window = { WENSHU_LEAD_CONFIG: { endpoint: 'https://www.xuntingtravel.com/api/wenshu' } };
  const token = 'ws_' + 'b'.repeat(64), actions = [];
  const fetch = async (address, options) => {
    const u = new URL(address), action = u.searchParams.get('action');
    actions.push({ action, method: options.method });
    if (action === 'session') return { ok: true, json: async () => ({ ok: true, token, conversation: { id: 'closed-conversation' } }) };
    if (action === 'lead') return { ok: true, json: async () => ({ ok: true, id: 'offline-receipt' }) };
    return { ok: true, json: async () => ({ ok: true, items: [], conversation: { status: 'closed' } }) };
  };
  vm.runInNewContext(code, { window, document, fetch, crypto, URL, AbortController, setTimeout, clearTimeout,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { origin: 'https://wenshuzhilv.kaifa2-xtch2026.chatgpt.site', pathname: '/' } });
  window.WenshuContact.initChat(); nodes.chatFab.handlers.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes.chatEnded.hidden, false);
  nodes.leaveMessage.value = '请安排英文导游'; nodes.leavePhone.value = '13800000000'; nodes.leaveAddress.value = '成都测试地址';
  nodes.chatLeave.handlers.click(); await nodes.chatLeaveForm.handlers.submit({ preventDefault() {} });
  assert.deepEqual(actions.filter(item => item.action === 'lead').map(item => item.method), ['POST']);
  assert.equal(actions.filter(item => item.action === 'messages' && item.method === 'POST').length, 0);
});
test('address and source sent; server receipt required', async () => {
  let posted;
  const api = setup(async (url, options) => {
    assert.equal(new URL(url).hostname, 'www.xuntingtravel.com');
    assert.equal(options.credentials, 'omit'); posted = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true, id: 'database-receipt' }) };
  });
  const result = await api.submitLead(form);
  assert.equal(result.id, 'database-receipt'); assert.equal(posted.company_address, form.companyAddress);
  assert.equal(posted.source, 'modal');
});
test('ambiguous failure retries with same idempotency key; no false success', async () => {
  const keys = [];
  const api = setup(async (_, options) => {
    keys.push(options.headers['Idempotency-Key']);
    if (keys.length === 1) throw new Error('Lost response');
    return { ok: true, json: async () => ({ ok: true, id: 'same-row' }) };
  });
  await assert.rejects(api.submitLead(form), /暂未确认/);
  await api.submitLead(form); assert.equal(keys[0], keys[1]);
});
test('HTTP 200 without database receipt is not accepted', async () => {
  const api = setup(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  await assert.rejects(api.submitLead(form), /暂未确认/);
});
test('generated forms have address and real messaging script in all languages', () => {
  for (const file of ['index.html', 'en/index.html', 'pages/product-wenxiaolv.html', 'en/pages/product-wenxiaolv.en.html']) {
    const html = fs.readFileSync(path.join(__dirname, '../dist', file), 'utf8');
    assert(html.includes('id="m-address"'), file);
    assert(html.includes('wenshu-contact.js'), file);
    assert(html.includes('window.WenshuContact.initChat()'), file);
    assert(html.includes('id="chatLeaveForm"'), file);
    assert(html.includes('id="chatEnded"'), file);
    assert(html.includes('id="chatChips"'), file);
    assert(html.includes('id="chatRetryButton"'), file);
    assert(html.includes('id="chatPanelTitle"'), file);
    assert(html.includes('id="chatStatus"'), file);
    assert(html.includes('aria-modal="true"'), file);
    assert(html.includes('class="cp-tools"'), file);
    assert(html.includes('id="chatToolHint"'), file);
    assert(html.includes('aria-controls="chatPanel"'), file);
    assert(html.includes('id="mobileMenuToggle"'), file);
    assert(html.includes('id="mobileNav"'), file);
    assert(html.includes('aria-expanded="false"'), file);
    assert(html.includes('class="speaker-wave"'), file);
    assert(html.includes('.chat-panel [hidden]{display:none !important}'), file);
    assert(!html.includes('id="qrMask"'), file);
    assert(!html.includes('qr-pop'), file);
    assert(!html.includes('class="foot-qr"'), file);
    assert(!html.includes('电话咨询<br>13558835750'), file);
    assert(!html.includes('>◔</span>'), file);
    assert(!html.includes('>▤</span>'), file);
    if (file.includes('product-wenxiaolv')) {
      if (file.startsWith('en/')) {
        assert(html.includes('Phone / WhatsApp'), file);
        assert(html.includes('Your phone or WhatsApp, including country code'), file);
      } else {
        assert(html.includes('联系电话'), file);
        assert(html.includes('请输入电话号码（含国家区号）'), file);
      }
    }
    if (file.startsWith('en/')) assert(html.includes('your message will be shared with the xuntingtravel team'), file);
    else assert(html.includes('留言会同步给 xuntingtravel 团队'), file);
    assert(!html.includes('感谢您的关注，Our support team'), file);
    assert(!html.includes('function sendChat()'), file);
  }
});

test('technology pages expose keyboard-operable feature markers', () => {
  for (const file of ['pages/tech-multilingual.html', 'en/pages/tech-multilingual.en.html']) {
    const html = fs.readFileSync(path.join(__dirname, '../dist', file), 'utf8');
    assert.match(html, /class="demo-mark"[^>]*role="button"[^>]*tabindex="0"/i, file);
    assert(html.includes('打开功能说明') || html.includes('Open feature details'), file);
  }
});

test('human chat connects, renders staff reply as text and sends visitor message', async () => {
  function element() {
    const classes = new Set();
    return { handlers: {}, children: [], style: {}, value: '', textContent: '',
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(el) { this.children.push(el); }, replaceChildren() { this.children = []; }, setAttribute() {} };
  }
  const nodes = Object.fromEntries(['chatPanel', 'chatFab', 'chatBody', 'chatInput', 'chatSend', 'chatClose', 'chatChips'].map(id => [id, element()]));
  nodes.chatPanel.querySelector = () => element();
  const document = { documentElement: { lang: 'zh' }, hidden: false,
    getElementById: id => nodes[id], createElement: element, addEventListener() {} };
  const window = { WENSHU_LEAD_CONFIG: { endpoint: 'https://www.xuntingtravel.com/api/wenshu' } };
  const token = 'ws_' + 'a'.repeat(64), sent = [];
  const fetch = async (address, options) => {
    const u = new URL(address); let payload;
    if (u.searchParams.get('action') === 'session') payload = { ok: true, token, conversation: { id: 'visitor-own-conversation' } };
    else {
      assert.equal(options.headers['X-Wenshu-Session'], token);
      assert.equal(u.searchParams.get('conversation'), 'visitor-own-conversation');
      if (options.method === 'POST') { sent.push(JSON.parse(options.body).body); payload = { ok: true, message: { id: 'v1' } }; }
      else payload = { ok: true, items: [{ id: 's1', seq: 1, sender_type: 'staff', body: '<b>真人客服回复</b>' }], conversation: { status: 'open' } };
    }
    return { ok: true, json: async () => payload };
  };
  vm.runInNewContext(code, { window, document, fetch, crypto, URL, AbortController, setTimeout, clearTimeout,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
  window.WenshuContact.initChat(); nodes.chatFab.handlers.click();
  await new Promise(resolve => setImmediate(resolve));
  try {
    assert(nodes.chatBody.children.some(el => el.textContent === '<b>真人客服回复</b>'));
    nodes.chatInput.value = '请介绍合作方式'; await nodes.chatSend.handlers.click();
    assert.deepEqual(sent, ['请介绍合作方式']); assert.equal(nodes.chatInput.value, '');
    assert.equal(nodes.chatBody.children.filter(el => el.textContent === '<b>真人客服回复</b>').length, 1);
  } finally { nodes.chatClose.handlers.click(); }
});
