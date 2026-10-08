(function () {
  'use strict';
  var en = document.documentElement.lang.indexOf('en') === 0;
  function text(zh, english) { return en ? english : zh; }
  var endpoint = function () { return (window.WENSHU_LEAD_CONFIG || {}).endpoint || ''; };
  function url(action) {
    var base = endpoint();
    if (!base) throw new Error(text('咨询服务暂不可用，请拨打 13558835750。', 'Please call +86 13558835750.'));
    var u = new URL(base); u.searchParams.set('action', action); return u;
  }
  async function request(u, method, body, headers) {
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var r = await fetch(String(u), { method: method, credentials: 'omit', cache: 'no-store',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
        body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
      var result = await r.json();
      if (!r.ok || result.ok !== true) { var error = new Error('Request failed'); error.status = r.status; throw error; }
      return result;
    } finally { clearTimeout(timer); }
  }
  var pendingLead = null;
  async function submitLead(data) {
    var payload = { name: data.name, phone: data.phone, company: data.company,
      company_address: data.companyAddress, business_type: data.businessType,
      source: data.source, page_url: location.origin + location.pathname,
      message: data.message || '', email: data.email || '' };
    if (!payload.company_address || !payload.company_address.trim()) throw new Error(text('请填写公司地址。', 'Please enter your company address.'));
    var fingerprint = JSON.stringify(payload);
    if (!pendingLead || pendingLead.fingerprint !== fingerprint) pendingLead = { fingerprint: fingerprint, id: crypto.randomUUID() };
    try {
      var r = await request(url('lead'), 'POST', payload, { 'Idempotency-Key': pendingLead.id });
      if (!r.id) throw new Error('Missing receipt');
      pendingLead = null; return r;
    } catch { throw new Error(text('暂未确认提交成功，您填写的内容已保留。请重试或拨打 13558835750。', 'Submission not confirmed. Your entries are retained. Retry or call +86 13558835750.')); }
  }
  function initChat() {
    var panel = document.getElementById('chatPanel'), fab = document.getElementById('chatFab');
    if (!panel || !fab) return;
    var body = document.getElementById('chatBody'), input = document.getElementById('chatInput'), phoneInput = document.getElementById('chatPhone');
    var send = document.getElementById('chatSend'), status = document.getElementById('chatStatus') || panel.querySelector('.cp-head div span') || panel.querySelector('.cp-head span:not(.cp-avatar)');
    var chips = document.getElementById('chatChips');
    body.replaceChildren(); body.setAttribute('aria-live', 'polite');
    var phoneNode = document.getElementById('chatPhone');
    var ended = false, endedPanel = document.getElementById('chatEnded'), tools = panel.querySelector('.cp-tools'), contact = phoneNode && phoneNode.parentElement,
        inputWrap = input && input.parentElement, speaker = document.getElementById('chatSpeaker'), retry = document.getElementById('chatRetry'), retryButton = document.getElementById('chatRetryButton');
    var token = '', conversation = '', seq = 0, polling = false, sending = false, connecting = false, hydrated = false, timer, epoch = 0;
    var failed = null, seen = new Set(), storage = 'wenshu_support_session_v2';
    try { token = sessionStorage.getItem(storage) || ''; } catch { /* In-memory session works without storage. */ }
    function state(value, kind) {
      if (ended && kind !== 'ended') return;
      if (status) { status.textContent = value; status.setAttribute('data-state', kind || 'online'); }
      if (retry) retry.hidden = ended || kind !== 'error';
    }
    function append(value, who) {
      var el = document.createElement('div'); el.className = 'cp-msg ' + who; el.textContent = value;
      body.appendChild(el); body.scrollTop = body.scrollHeight;
    }
    function appendStartMeta() {
      var now = new Date(), time = now.toLocaleTimeString(en ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      var stamp = document.createElement('div'); stamp.className = 'cp-time'; stamp.textContent = text('今天 ' + time + ' 开始沟通', 'Today ' + time + ' · Chat started'); body.appendChild(stamp);
      var label = document.createElement('div'); label.className = 'cp-agent-label'; label.textContent = text('文小旅客服  今天 ' + time, 'Wenshu support  Today ' + time); body.appendChild(label);
    }
    function resetMessages() {
      body.replaceChildren(); hydrated = false; appendStartMeta();
      append(text('您好，请留下您的问题。客服回复后会显示在这里；紧急事项请致电 13558835750。', 'Hello, please leave your question. Staff replies will appear here. For urgent requests call +86 13558835750.'), 'bot');
    }
    function appendStaffMeta(m) {
      var date = m && m.created_at ? new Date(m.created_at) : new Date();
      var time = Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(en ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      var label = document.createElement('div'); label.className = 'cp-agent-label';
      label.textContent = text('xuntingtravel 客服' + (time ? '  今天 ' + time : ''), 'xuntingtravel support' + (time ? '  Today ' + time : ''));
      body.appendChild(label);
    }
    function playNotify() {
      if (!speaker || speaker.getAttribute('aria-pressed') === 'true' || !window.AudioContext) return;
      try {
        var audio = playNotify.ctx || (playNotify.ctx = new window.AudioContext());
        var oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = 880; gain.gain.value = 0.045;
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.08);
      } catch { /* Notification sound is optional and browser-gated. */ }
    }
    function render(items, notify) { (items || []).forEach(function (m) {
      if (!m || !m.id) return;
      if (!seen.has(m.id)) { seen.add(m.id); if (m.sender_type !== 'visitor') { appendStaffMeta(m); append(m.body, 'bot'); if (notify) playNotify(); } else append(m.body, 'user'); }
      var messageSeq = Number(m.seq); if (Number.isFinite(messageSeq)) seq = Math.max(seq, messageSeq);
    }); }
    function setEnded(value) {
      ended = value;
      if (ended) {
        if (body) body.hidden = true; if (panel.querySelector('.cp-welcome')) panel.querySelector('.cp-welcome').hidden = true;
        if (tools) tools.hidden = true; if (chips) chips.hidden = true; if (contact) contact.hidden = true; if (inputWrap) inputWrap.hidden = true; if (retry) retry.hidden = true;
        if (endedPanel) endedPanel.hidden = false;
        state(text('本次沟通已结束', 'Conversation ended'), 'ended');
      } else {
        if (body) body.hidden = false; if (panel.querySelector('.cp-welcome')) panel.querySelector('.cp-welcome').hidden = false;
        if (tools) tools.hidden = false; if (chips) chips.hidden = false; if (contact) contact.hidden = false; if (inputWrap) inputWrap.hidden = false;
        if (endedPanel) endedPanel.hidden = true;
        state(text('人工客服 · 在线接待', 'Human support · Online'));
      }
    }
    function expire(showEnded) {
      epoch += 1;
      token = ''; conversation = ''; seq = 0; seen.clear(); failed = null;
      try { sessionStorage.removeItem(storage); } catch { /* optional */ }
      if (showEnded) setEnded(true);
    }
    async function connect() {
      if (connecting) return; var run = ++epoch; connecting = true; if (send) send.disabled = true; panel.setAttribute('aria-busy', 'true');
      setEnded(false); resetMessages(); state(text('正在连接客服…', 'Connecting…'), 'connecting');
      try {
        var r;
        try { r = await request(url('session'), 'POST', {}, token ? { 'X-Wenshu-Session': token } : {}); }
        catch (e) { if (e.status !== 401) throw e; expire(false); run = epoch; r = await request(url('session'), 'POST', {}); }
        if (run !== epoch) return;
        if (r.token) { token = r.token; try { sessionStorage.setItem(storage, token); } catch { /* optional */ } }
        if (conversation && conversation !== r.conversation.id) { seq = 0; seen.clear(); resetMessages(); }
        conversation = r.conversation.id;
        state(text('已连接 · 回复后会显示在这里', 'Connected · Replies appear here'), 'online');
        if (send) send.disabled = false; await poll(run);
      } catch { state(text('连接失败，可重新连接或电话咨询', 'Connection failed. Reconnect or call us.'), 'error'); if (send) send.disabled = false; }
      finally { connecting = false; panel.setAttribute('aria-busy', 'false'); }
    }
    async function poll(run) {
      run = Number.isFinite(run) ? run : epoch;
      if (run !== epoch) return;
      clearTimeout(timer);
      if (polling || ended || !conversation || document.hidden || !panel.classList.contains('open')) return;
      polling = true;
      try {
        var activeConversation = conversation;
        var u = url('messages'); u.searchParams.set('conversation', activeConversation); u.searchParams.set('after_seq', seq);
        var r = await request(u, 'GET', null, { 'X-Wenshu-Session': token });
        if (run !== epoch || conversation !== activeConversation) return;
        render(r.items, hydrated); hydrated = true;
        if (r.conversation && r.conversation.status === 'closed') { expire(true); return; }
        state(text('已连接 · 回复后会显示在这里', 'Connected · Replies appear here'), 'online');
      } catch (e) { if (run !== epoch) return; if (e.status === 401) { expire(false); if (panel.classList.contains('open')) setTimeout(connect, 0); } else state(text('连接中断，消息已保留，请重新连接', 'Disconnected. Please reconnect.'), 'error'); }
      finally { polling = false; if (run === epoch && conversation && !ended && panel.classList.contains('open')) timer = setTimeout(function () { poll(run); }, 4000); }
    }
    async function postVisitorBody(outbound, id) {
      if (!conversation) { await connect(); if (!conversation) throw new Error('Conversation unavailable'); }
      var u = url('messages'); u.searchParams.set('conversation', conversation);
      return await request(u, 'POST', { body: outbound, contentType: 'text' }, { 'X-Wenshu-Session': token, 'Idempotency-Key': id || crypto.randomUUID() });
    }
    async function sendMessage() {
      if (sending || connecting) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) { state(text('当前处于离线状态，请恢复网络后重试', 'You are offline. Reconnect and try again.'), 'error'); return; }
      var value = input.value.trim(); if (!value || value.length > 8000) return;
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var outbound = phone ? value + '\n联系电话：' + phone : value;
      sending = true; if (send) send.disabled = true;
      if (!failed || failed.body !== outbound) failed = { body: outbound, id: crypto.randomUUID() };
      try {
        var result = await postVisitorBody(outbound, failed.id);
        // The API returns the durable message row. Render it immediately for a
        // responsive composer; the following poll safely de-duplicates by id.
        if (result && result.message && result.message.id && result.message.body) render([result.message], false);
        await poll();
        if (input.value.trim() === value) input.value = ''; if (phoneInput && phoneInput.value.trim() === phone) phoneInput.value = ''; failed = null;
      } catch (e) { if (e.status === 401) expire(true); else state(text('发送未确认，请重试；不会重复发送', 'Send not confirmed. Retry safely.'), 'error'); }
      finally { sending = false; if (send) send.disabled = false; }
    }
    async function submitOffline(form) {
      var message = document.getElementById('leaveMessage').value.trim(), phone = document.getElementById('leavePhone').value.trim(), address = document.getElementById('leaveAddress').value.trim();
      var name = document.getElementById('leaveName').value.trim(), email = document.getElementById('leaveEmail').value.trim(), feedback = document.getElementById('chatLeaveFeedback'), button = form.querySelector('button[type="submit"]');
      if (!message || !phone || !address || !/^\+?[\d ()-]{6,40}$/.test(phone) || phone.replace(/\D/g, '').length < 6) { feedback.className = 'chat-leave-feedback'; feedback.textContent = text('请填写留言、有效电话和公司地址。', 'Please enter a message, valid phone and company address.'); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { feedback.className = 'chat-leave-feedback'; feedback.textContent = text('请填写有效邮箱，或暂时留空。', 'Please enter a valid email address or leave it blank.'); return; }
      if (button) button.disabled = true; feedback.className = 'chat-leave-feedback'; feedback.textContent = text('正在提交，请稍候…', 'Submitting, please wait…');
      try {
        // The lead row is the durable offline channel. Never create/reopen an IM
        // conversation just because a visitor left a message after staff closed it.
        var hadActiveConversation = Boolean(conversation && token && !ended);
        await submitLead({ source: 'offline-message', phone: phone, name: name, company: '', companyAddress: address, businessType: '人工客服留言', message: message, email: email });
        if (hadActiveConversation) {
          var note = '【人工客服留言】\n留言内容：' + message + '\n姓名：' + (name || '未填写') + '\n电话：' + phone + '\n邮箱：' + (email || '未填写') + '\n公司地址：' + address;
          if (note.length > 8000) note = note.slice(0, 7990) + '…';
          try { await postVisitorBody(note, crypto.randomUUID()); } catch { /* The lead receipt remains authoritative. */ }
        }
        feedback.className = 'chat-leave-feedback ok'; feedback.textContent = text('留言已提交，我们会尽快与您联系。', 'Your message was received. We will contact you shortly.');
        form.reset(); setTimeout(function () { var mask = document.getElementById('chatLeaveMask'); if (mask) mask.classList.remove('open'); }, 1800);
      } catch (e) { feedback.className = 'chat-leave-feedback'; feedback.textContent = (e && e.message) || text('提交未确认，请重试或拨打 13558835750。', 'Submission not confirmed. Please retry or call +86 13558835750.'); }
      finally { if (button) button.disabled = false; }
    }
    input.maxLength = 8000; input.placeholder = text('输入您想咨询的问题', 'Type your message'); resetMessages();
    var fabTitle = fab.querySelector ? fab.querySelector('.chat-fab-copy b') : null;
    function setFabMode(mode) {
      fab.setAttribute('data-mode', mode);
      if (fabTitle) fabTitle.textContent = mode === 'resume' ? text('继续咨询', 'Resume chat') : text('在线咨询', 'Online support');
    }
    function openChat() {
      panel.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); fab.setAttribute('aria-label', text('关闭在线咨询', 'Close support chat')); fab.style.display = 'none';
      if (input && input.focus) setTimeout(function () { input.focus(); }, 0);
      if (ended || !conversation) connect(); else poll();
    }
    fab.addEventListener('click', openChat);
    function closePanel(mode) { panel.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-label', text('打开在线咨询', 'Open support chat')); setFabMode(mode === 'minimize' ? 'resume' : 'chat'); fab.style.display = ''; clearTimeout(timer); if (fab.focus) fab.focus(); }
    var min = document.getElementById('chatMin'); if (min) min.addEventListener('click', function () { closePanel('minimize'); });
    var close = document.getElementById('chatClose');
    if (close) close.addEventListener('click', function () { closePanel('close'); });
    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendMessage(); } });
    if (chips && chips.querySelectorAll) Array.prototype.forEach.call(chips.querySelectorAll('.cp-chip'), function (chip) {
      chip.addEventListener('click', function () { input.value = chip.getAttribute('data-q') || chip.textContent.trim(); input.focus(); sendMessage(); });
    });
    if (speaker) speaker.addEventListener('click', function () { var muted = speaker.getAttribute('aria-pressed') === 'true'; speaker.setAttribute('aria-pressed', String(!muted)); speaker.classList.toggle('muted', !muted); speaker.setAttribute('aria-label', !muted ? text('打开提示音', 'Unmute notifications') : text('静音提示音', 'Mute notifications')); });
    var toolHint = document.getElementById('chatToolHint');
    function showToolHint(value) { if (!toolHint) return; toolHint.textContent = value; toolHint.hidden = false; clearTimeout(showToolHint.timer); showToolHint.timer = setTimeout(function () { toolHint.hidden = true; }, 3200); }
    var toolButtons = panel.querySelectorAll ? panel.querySelectorAll('.cp-tool') : [];
    Array.prototype.forEach.call(toolButtons, function (tool) {
      tool.addEventListener('click', function () {
        var kind = tool.getAttribute('data-tool');
        if (kind === 'emoji') { input.value += (input.value ? ' ' : '') + '😊'; input.focus(); return; }
        showToolHint(text('当前支持文字咨询；图片和文件可在留言中说明，客服会继续跟进。', 'Text chat is supported here. Describe an image or file in your message and our team will follow up.'));
      });
    });
    if (retryButton) retryButton.addEventListener('click', function () { expire(false); setEnded(false); connect(); });
    var continueButton = document.getElementById('chatContinue');
    if (continueButton) continueButton.addEventListener('click', function () {
      // Reuse the same entry path as the floating button so the panel, focus,
      // session reset, and connection state cannot drift apart after closure.
      expire(false);
      openChat();
    });
    var leaveButton = document.getElementById('chatLeave'), leaveMask = document.getElementById('chatLeaveMask'), leaveClose = document.getElementById('chatLeaveClose'), leaveForm = document.getElementById('chatLeaveForm'), leaveFocus = null;
    function closeLeave() { if (leaveMask) leaveMask.classList.remove('open'); if (leaveFocus && leaveFocus.focus) leaveFocus.focus(); leaveFocus = null; }
    function openLeave() { if (leaveMask) { leaveFocus = document.activeElement; leaveMask.classList.add('open'); var field = document.getElementById('leaveMessage'); if (field) setTimeout(function () { field.focus(); }, 60); } }
    if (leaveButton) leaveButton.addEventListener('click', openLeave);
    if (leaveClose) leaveClose.addEventListener('click', closeLeave);
    if (leaveMask) leaveMask.addEventListener('click', function (e) { if (e.target === leaveMask) closeLeave(); });
    if (leaveForm) leaveForm.addEventListener('submit', function (e) { e.preventDefault(); submitOffline(leaveForm); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && panel.classList.contains('open') && panel.querySelectorAll) {
        var focusables = Array.prototype.filter.call(panel.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]'), function (el) {
          return !el.hidden && !(el.closest && el.closest('[hidden]'));
        });
        if (focusables.length) {
          var first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === 'Escape') { if (leaveMask && leaveMask.classList.contains('open')) closeLeave(); else if (panel.classList.contains('open')) closePanel(); }
    });
    if (window.addEventListener) {
      window.addEventListener('offline', function () { if (panel.classList.contains('open') && !ended) state(text('当前处于离线状态，请恢复网络后重试', 'You are offline. Reconnect and try again.'), 'error'); });
      window.addEventListener('online', function () { if (panel.classList.contains('open') && conversation && !ended) { state(text('网络已恢复，正在重新连接…', 'Back online. Reconnecting…'), 'connecting'); poll(); } });
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
    window.WenshuContact.openChat = openChat;
  }
  window.WenshuContact = { submitLead: submitLead, initChat: initChat, openChat: null };
})();
