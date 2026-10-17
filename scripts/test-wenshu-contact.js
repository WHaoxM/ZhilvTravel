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
test('classified request carries intent, email and business type; missing email is not sent', async () => {
  const posted = [];
  const api = setup(async (_, options) => {
    posted.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true, id: 'classified-receipt' }) };
  });
  const classified = { ...form, source: 'hero-demo', intent: 'product_demo', email: 'buyer@example.com' };
  await assert.rejects(api.submitLead({ ...classified, email: '' }), /有效邮箱/);
  await assert.rejects(api.submitLead({ ...classified, businessType: '' }), /业务类型/);
  await api.submitLead(classified);
  assert.equal(posted.length, 1);
  assert.equal(posted[0].intent, 'product_demo');
  assert.equal(posted[0].email, 'buyer@example.com');
  assert.equal(posted[0].business_type, form.businessType);
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
  nodes.chatPanel.parentNode = { insertBefore() {} };
  const status = element(), welcome = element(), submit = element();
  nodes.chatPanel.querySelector = selector => selector === '.cp-welcome' ? welcome : selector === '.cp-head div span' ? status : selector === 'button[type="submit"]' ? submit : element();
  nodes.chatPanel.querySelectorAll = () => [];
  nodes.chatLeaveForm.querySelector = () => submit;
  const document = { documentElement: { lang: 'zh' }, body: element(), hidden: false,
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
  nodes.leaveMessage.value = '请安排英文导游'; nodes.leavePhone.value = '13800000000'; nodes.leaveAddress.value = '成都测试地址'; nodes.leaveEmail.value = 'buyer@example.com';
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
    assert.match(html, /id="m-email"[^>]*required/, file);
    assert.match(html, /id="m-type"[^>]*required/, file);
    assert.match(html, /id="leaveEmail"[^>]*required/, file);
    if (file.endsWith('index.html')) {
      assert.match(html, /id="f-email"[^>]*required/, file);
      assert.match(html, /id="f-type"[^>]*required/, file);
    }
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
    assert(html.includes('id="chatEmojiMenu"') && html.includes('data-emoji="🙏"'), file);
    assert(html.includes('id="chatImageInput"') && html.includes('id="chatFileInput"'), file);
    assert(html.includes('id="chatAttachmentRetryButton"') && html.includes('id="chatUnread"'), file);
    assert(html.includes('.cp-emoji-menu[hidden],.cp-attachment-retry[hidden]{display:none}'), file);
    assert(!html.includes('当前支持文字咨询；图片和文件可在留言中说明'), file);
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
    if (file.startsWith('en/')) assert(html.includes("Leave your question and contact details, and we'll get back to you soon."), file);
    else assert(html.includes('请留下问题和联系方式，我们会尽快与您联系。'), file);
    assert(!html.includes('xuntingtravel 团队') && !html.includes('the xuntingtravel team'), file);
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
  nodes.chatPanel.parentNode = { insertBefore() {} };
  nodes.chatPanel.querySelector = () => element();
  const document = { documentElement: { lang: 'zh' }, body: element(), hidden: false,
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
  } finally { document.hidden = true; nodes.chatClose.handlers.click(); }
});

test('visitor chat multimodal controls upload, retry idempotently, hydrate history and alert only after explicit opt-in', async () => {
  function element() {
    const attrs = {}, classes = new Set();
    return {
      handlers: {}, children: [], attrs, style: {}, value: '', textContent: '', hidden: false, disabled: false,
      className: '', files: [], selectionStart: 0, selectionEnd: 0,
      classList: {
        add: (...items) => items.forEach((item) => classes.add(item)),
        remove: (...items) => items.forEach((item) => classes.delete(item)),
        contains: (item) => classes.has(item),
        toggle: (item, force) => { const next = force === undefined ? !classes.has(item) : force; if (next) classes.add(item); else classes.delete(item); return next; },
      },
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(el) { this.children.push(el); return el; },
      replaceChildren(...items) { this.children = items; },
      setAttribute(name, value) { attrs[name] = String(value); },
      getAttribute(name) { return attrs[name] ?? null; },
      setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
      setProperty(name, value) { this.style[name] = value; },
      focus() {}, click() { this.clickCount = (this.clickCount || 0) + 1; }, reset() { this.value = ''; },
    };
  }
  const ids = ['chatPanel', 'chatFab', 'chatBody', 'chatInput', 'chatSend', 'chatClose', 'chatChips', 'chatStatus',
    'chatSpeaker', 'chatContinue', 'chatLeave', 'chatLeaveMask', 'chatLeaveClose', 'chatLeaveForm', 'chatImageInput',
    'chatFileInput', 'chatEmojiMenu', 'chatToolHint', 'chatAttachmentRetry', 'chatAttachmentRetryButton',
    'chatAttachmentDiscardButton', 'chatAttachmentRetryText', 'chatUnread', 'chatRetry', 'chatRetryButton', 'chatEnded'];
  const nodes = Object.fromEntries(ids.map((id) => [id, element()]));
  nodes.chatPanel.parentNode = { insertBefore() {} };
  nodes.chatPanel.classList.add('closed');
  nodes.chatUnread.hidden = true;
  nodes.chatInput.parentElement = element(); nodes.chatSend.disabled = false;
  nodes.chatPanel.querySelector = (selector) => {
    if (selector === '.cp-tools') return element();
    if (selector === '.cp-welcome') return element();
    if (selector === '.cp-head div span' || selector === '.cp-head span:not(.cp-avatar)') return nodes.chatStatus;
    if (selector === '[data-tool="reminder"]') return tools.find((item) => item.getAttribute('data-tool') === 'reminder');
    if (selector === '[data-tool="emoji"]') return tools.find((item) => item.getAttribute('data-tool') === 'emoji');
    if (selector === 'button[type="submit"]') return element();
    return element();
  };
  const emojiButton = element(); emojiButton.setAttribute('data-tool', 'emoji');
  const imageButton = element(); imageButton.setAttribute('data-tool', 'image');
  const fileButton = element(); fileButton.setAttribute('data-tool', 'file');
  const reminderButton = element(); reminderButton.setAttribute('data-tool', 'reminder');
  const tools = [emojiButton, imageButton, fileButton, reminderButton];
  const emoji = element(); emoji.setAttribute('data-emoji', '😊');
  nodes.chatEmojiMenu.hidden = true;
  nodes.chatEmojiMenu.querySelector = () => emoji;
  nodes.chatEmojiMenu.querySelectorAll = (selector) => selector === '[data-emoji]' ? [emoji] : [];
  nodes.chatPanel.querySelectorAll = (selector) => selector === '.cp-tool' ? tools : [];
  nodes.chatFab.querySelector = () => element();
  nodes.chatFab.style = {};
  const eventHandlers = {};
  const document = { documentElement: { lang: 'zh' }, body: element(), hidden: false,
    getElementById: (id) => nodes[id] || null, createElement: element,
    addEventListener(name, fn) { eventHandlers[name] = fn; } };
  const token = 'ws_' + 'c'.repeat(64), conversation = 'visitor-owned-conversation';
  const sessionStore = new Map();
  const sessionStorage = { getItem: (key) => sessionStore.get(key) || null, setItem: (key, value) => sessionStore.set(key, value), removeItem: (key) => sessionStore.delete(key) };
  const notificationState = { requests: 0, created: 0 };
  class NotificationMock {
    static permission = 'default';
    static async requestPermission() { notificationState.requests += 1; return 'denied'; }
    constructor() { notificationState.created += 1; }
  }
  const fetchCalls = [], uploads = [], sentMessages = [], ticketCalls = new Map();
  let messagePoll = 0, fileMessageAttempts = 0;
  const imageAttachmentId = 'image-attachment';
  const fileAttachmentId = 'file-attachment';
  const fetch = async (address, options) => {
    const u = new URL(address), action = u.searchParams.get('action');
    fetchCalls.push({ url: String(u), action, method: options.method, headers: options.headers, body: options.body });
    if (String(u).includes('/s3/')) {
      uploads.push({ url: String(u), headers: options.headers, body: options.body });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    if (action === 'session') return { ok: true, status: 200, json: async () => ({ ok: true, token, conversation: { id: conversation } }) };
    if (action === 'media-upload') {
      const body = JSON.parse(options.body), id = body.clientUploadId;
      const attempt = (ticketCalls.get(id) || 0) + 1; ticketCalls.set(id, attempt);
      const isImage = body.file.kind === 'image', attachmentId = isImage ? imageAttachmentId : fileAttachmentId;
      return { ok: true, status: 200, json: async () => ({ ok: true, ticket: {
        attachmentId, filename: body.file.filename, contentType: body.file.contentType, byteSize: body.file.byteSize,
        kind: body.file.kind, uploadUrl: attempt === 1 ? `https://www.xuntingtravel.com/s3/xtch-im-private/${attachmentId}?sig=short` : '', expiresInSeconds: 300,
      } }) };
    }
    if (action === 'media-links') {
      const { attachmentIds } = JSON.parse(options.body);
      return { ok: true, status: 200, json: async () => ({ ok: true, urls: Object.fromEntries(attachmentIds.map((id) => [id, `https://www.xuntingtravel.com/s3/xtch-im-private/${id}?get=short`])) }) };
    }
    if (action === 'messages' && options.method === 'GET') {
      messagePoll += 1;
      const items = messagePoll === 1 ? [{ id: 'historical-staff', seq: 1, sender_type: 'staff', body: '既有客服答复', content_type: 'text' }]
        : messagePoll >= 5 ? [
          { id: 'system-event', seq: 2, sender_type: 'system', body: 'system state', content_type: 'system' },
          { id: 'new-staff', seq: 3, sender_type: 'staff', body: '新的客服答复', content_type: 'text' },
        ] : [];
      return { ok: true, status: 200, json: async () => ({ ok: true, items, conversation: { status: 'open' } }) };
    }
    if (action === 'messages' && options.method === 'POST') {
      const body = JSON.parse(options.body); sentMessages.push({ body, headers: options.headers });
      if (body.contentType === 'file' && ++fileMessageAttempts === 1) {
        return { ok: false, status: 503, json: async () => ({ ok: false, error: 'Message receipt unavailable' }) };
      }
      const attachmentId = body.contentType === 'image' ? imageAttachmentId : fileAttachmentId;
      return { ok: true, status: 201, json: async () => ({ ok: true, message: {
        id: `${body.contentType}-message`, seq: body.contentType === 'image' ? 2 : 3, sender_type: 'visitor',
        content_type: body.contentType, body: body.body, metadata: { attachmentId, filename: body.body, byteSize: body.contentType === 'image' ? 4 : 12 },
      } }) };
    }
    throw new Error(`Unexpected request ${options.method} ${u}`);
  };
  const window = { WENSHU_LEAD_CONFIG: { endpoint: 'https://www.xuntingtravel.com/api/wenshu' }, Notification: NotificationMock,
    addEventListener() {}, matchMedia: () => ({ matches: false }) };
  let nextTimer = 0;
  const setTimeout = () => ++nextTimer;
  const clearTimeout = () => {};
  document.createElement = (tagName) => { const created = element(); created.tagName = String(tagName).toUpperCase(); return created; };
  vm.runInNewContext(code, { window, document, fetch, crypto, URL, AbortController, setTimeout, clearTimeout,
    navigator: { onLine: true }, sessionStorage, location: { origin: 'https://www.zhilvtravel.com', pathname: '/' } });
  const flush = async () => { for (let i = 0; i < 10; i += 1) await new Promise((resolve) => setImmediate(resolve)); };
  window.WenshuContact.initChat();
  assert.equal(notificationState.requests, 0, 'notification permission is not requested during hydration');
  nodes.chatFab.handlers.click(); await flush();
  assert(nodes.chatBody.children.some((item) => item.textContent === '既有客服答复'));
  assert.equal(nodes.chatUnread.hidden, true, 'the badge stays hidden before any new reply');
  assert.equal(notificationState.created, 0, 'initial historical messages do not notify');

  nodes.chatInput.value = 'Hi'; nodes.chatInput.selectionStart = 1; nodes.chatInput.selectionEnd = 1;
  emojiButton.handlers.click(); assert.equal(nodes.chatEmojiMenu.hidden, false);
  emoji.handlers.click(); assert.equal(nodes.chatInput.value, 'H😊i');

  const imageFile = { name: 'plan.png', size: 4 };
  imageButton.handlers.click(); assert.equal(nodes.chatImageInput.clickCount, 1);
  nodes.chatImageInput.files = [imageFile]; nodes.chatImageInput.handlers.change(); await flush();
  const imageUpload = uploads.find((item) => item.url.includes(imageAttachmentId));
  assert(imageUpload); assert.equal(imageUpload.headers['If-None-Match'], '*');
  assert.equal(imageUpload.headers['Content-Type'], 'image/png');
  assert(sentMessages.some((item) => item.body.contentType === 'image' && item.body.metadata.attachmentId === imageAttachmentId));
  assert(nodes.chatBody.children.some((item) => item.className.includes('cp-attachment') &&
    item.children?.some((anchor) => anchor.children?.some((child) => child.tagName === 'IMG'))));

  const file = { name: 'quote.pdf', size: 12 };
  fileButton.handlers.click(); assert.equal(nodes.chatFileInput.clickCount, 1);
  nodes.chatFileInput.files = [file]; nodes.chatFileInput.handlers.change(); await flush();
  assert.equal(fileMessageAttempts, 1);
  assert.equal(nodes.chatAttachmentRetry.hidden, false, 'failed message stays retryable');
  const firstFileSend = sentMessages.find((item) => item.body.contentType === 'file');
  assert(firstFileSend);
  const failedUploadId = fetchCalls.find((call) => call.action === 'media-upload' && JSON.parse(call.body).file.kind === 'file');
  assert(failedUploadId);
  nodes.chatAttachmentRetryButton.handlers.click(); await flush();
  assert.equal(fileMessageAttempts, 2);
  const fileUploadCalls = fetchCalls.filter((call) => call.action === 'media-upload' && JSON.parse(call.body).file.kind === 'file');
  assert.equal(fileUploadCalls.length, 2);
  assert.equal(JSON.parse(fileUploadCalls[0].body).clientUploadId, JSON.parse(fileUploadCalls[1].body).clientUploadId);
  const fileSends = sentMessages.filter((item) => item.body.contentType === 'file');
  assert.equal(fileSends[0].body.clientMessageId, fileSends[1].body.clientMessageId);
  assert.equal(uploads.filter((item) => item.url.includes(fileAttachmentId)).length, 1, 'retry reuses the immutable uploaded object');
  assert.equal(nodes.chatAttachmentRetry.hidden, true);

  assert.equal(notificationState.requests, 0, 'permission remains untouched until the bell is clicked');
  reminderButton.handlers.click(); await flush();
  assert.equal(notificationState.requests, 1);
  assert.equal(reminderButton.getAttribute('aria-pressed'), 'true', 'denied system permission falls back to site reminders');
  document.hidden = true; nodes.chatClose.handlers.click();
  eventHandlers.visibilitychange(); await flush();
  assert.equal(nodes.chatUnread.textContent, '1', 'a new reply while minimized increments the in-page badge');
  assert.equal(nodes.chatUnread.hidden, false);
  assert.equal(notificationState.created, 0, 'browser denial does not fabricate system notifications');
});
