const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'dist');

function classList() {
  const values = new Set();
  return {
    toggle(name, force) {
      const enabled = force === undefined ? !values.has(name) : !!force;
      if (enabled) values.add(name);
      else values.delete(name);
      return enabled;
    },
    contains(name) { return values.has(name); }
  };
}

function video(src) {
  return {
    dataset: {src}, duration: NaN, currentTime: 0,
    paused: true, loads: 0, plays: 0, reject: false,
    hasAttribute(name) { return name === 'src' && typeof this.src === 'string'; },
    removeAttribute(name) { if (name === 'src') delete this.src; },
    load() { this.loads++; },
    pause() { this.paused = true; },
    play() {
      this.plays++;
      this.paused = false;
      return {catch: fn => {
        if (this.reject) fn({name: 'NotAllowedError'});
      }};
    },
    addEventListener(name, fn) { this[name] = fn; }
  };
}

function harness(html, reduced = false, observer = true) {
  const heroVideos = [video('hero-one.mp4'), video('hero-two.mp4')];
  const engineVideo = video('engine-demo.mp4');
  const panes = [null, ...heroVideos].map(item => ({
    video: item,
    dataset: {},
    classList: classList()
  }));
  const tabs = panes.map(() => ({
    classList: classList(),
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(name, fn) { this[name] = fn; },
    bar: {style: {}}
  }));
  const engineSteps = [1, 2, 3].map(() => ({classList: classList()}));
  const engineDemo = {
    style: {
      values: {},
      setProperty(name, value) { this.values[name] = value; }
    }
  };
  const toggleLabel = {textContent: ''};
  const engineToggle = {
    dataset: {
      paused: 'false',
      pauseLabel: 'Pause demo',
      playLabel: 'Play demo',
      pauseText: 'Pause',
      playText: 'Play'
    },
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(name, fn) { this[name] = fn; }
  };
  const heroScreen = {};
  const screenTitle = {textContent: ''};
  const preference = {
    matches: reduced,
    addEventListener(name, fn) { this[name] = fn; },
    addListener(fn) { this.change = fn; }
  };
  const document = {
    hidden: false,
    addEventListener(name, fn) { this[name] = fn; }
  };
  const observed = [];
  const context = {
    window: {matchMedia: () => preference},
    document,
    performance: {now: () => 0},
    requestAnimationFrame() {},
    $(selector, parent) {
      if (selector === 'video') return parent.video;
      if (selector === '.bar') return parent.bar;
      if (selector === 'span' && parent === engineToggle) return toggleLabel;
      if (selector === '.hero-screen') return heroScreen;
      if (selector === '#screenTitle') return screenTitle;
      if (selector === '[data-engine-demo]') return engineDemo;
      if (selector === '[data-engine-video]') return engineVideo;
      if (selector === '#engineVideoToggle') return engineToggle;
      return {};
    },
    $$(selector, parent) {
      if (selector === '.demo-pane') return panes;
      if (selector === '.stab') return tabs;
      if (selector === '[data-engine-step]' && parent === engineDemo) return engineSteps;
      return [];
    }
  };
  if (observer) {
    context.IntersectionObserver = function IntersectionObserver(callback, options) {
      this.observe = target => { observed.push({callback, options, target}); };
    };
    context.window.IntersectionObserver = context.IntersectionObserver;
  }
  vm.createContext(context);
  const start = html.indexOf('  var panes =');
  const end = html.indexOf('  /* ---------- S2', start);
  assert(start > 0 && end > start, 'hero/engine lifecycle script must remain discoverable');
  vm.runInContext(html.slice(start, end), context);

  function setVisibility(target, isIntersecting) {
    const registration = observed.find(entry => entry.target === target);
    assert(registration, 'expected an IntersectionObserver registration for the requested surface');
    registration.callback([{isIntersecting, target}]);
  }

  return {
    context,
    document,
    engineDemo,
    engineSteps,
    engineToggle,
    engineVideo,
    heroScreen,
    heroVideos,
    preference,
    setEngineVisible(value) { setVisibility(engineDemo, value); },
    setHeroVisible(value) { setVisibility(heroScreen, value); }
  };
}

for (const route of ['index.html', 'en/index.html']) {
  const file = path.join(root, route);
  const html = fs.readFileSync(file, 'utf8');

  const heroTags = html.match(/<video\b[^>]*wenshu-ai-[^>]*>/g) || [];
  assert.equal(heroTags.length, 2, `${route}: expected both hero videos`);
  for (const tag of heroTags) {
    assert(!/(?:^|\s)(?:src|autoplay)\s*=?/.test(tag), `${route}: hero video must start poster-only`);
    for (const required of ['data-src=', 'poster=', 'muted', 'playsinline', 'preload="metadata"']) {
      assert(tag.includes(required), `${route}: hero video is missing ${required}`);
    }
    for (const [, ref] of tag.matchAll(/(?:data-src|poster)="([^"]+)"/g)) {
      assert(fs.existsSync(path.resolve(root, path.dirname(route), ref)), `${route}: missing ${ref}`);
    }
  }
  const openLinks = [...html.matchAll(/<a\b[^>]*class="pane-video-open"[^>]*href="([^"]+)"[^>]*>\s*([^<]+)<\/a>/g)];
  assert.equal(openLinks.length, 2, `${route}: expected one larger-view link per hero video`);
  for (const [, ref, label] of openLinks) {
    assert(fs.existsSync(path.resolve(root, path.dirname(route), ref)), `${route}: missing larger-view video ${ref}`);
    assert(/\.mp4$/.test(ref) && label.trim(), `${route}: larger-view link needs a video and visible label`);
  }
  assert(/\.pane-shot--video video\s*\{object-fit:contain\}/.test(html), `${route}: enlarged desktop stage must not crop video text`);

  const engineTags = html.match(/<video\b[^>]*\bdata-engine-video\b[^>]*>/g) || [];
  assert.equal(engineTags.length, 1, `${route}: expected one data-engine-video demo`);
  assert(/<(?:div|section)\b[^>]*\bdata-engine-demo\b[^>]*>/.test(html), `${route}: engine observer needs a real demo surface`);
  const engineTag = engineTags[0];
  assert(!/(?:^|\s)(?:src|autoplay)\s*=?/.test(engineTag), `${route}: engine video must have no initial src/autoplay`);
  for (const required of [
    'data-src=', 'poster=', 'width="1254"', 'height="720"',
    'muted', 'loop', 'playsinline', 'preload="metadata"'
  ]) {
    assert(engineTag.includes(required), `${route}: engine video is missing ${required}`);
  }
  for (const [, ref] of engineTag.matchAll(/(?:data-src|poster)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(root, path.dirname(route), ref)), `${route}: missing ${ref}`);
  }
  assert(
    /\.ew-visual\s*\{[^}]*aspect-ratio\s*:\s*1254\s*\/\s*720[^}]*\}/s.test(html),
    `${route}: engine frame must preserve the 1254/720 ratio`
  );
  assert(
    /\.ew-video\s*\{[^}]*height\s*:\s*100%[^}]*\}/s.test(html),
    `${route}: engine video must fill the ratio-locked frame`
  );

  let h = harness(html);
  assert(!h.engineVideo.hasAttribute('src') && h.engineVideo.paused, `${route}: engine starts poster-only`);
  h.setHeroVisible(true);
  assert(!h.engineVideo.hasAttribute('src') && h.engineVideo.paused, `${route}: the hero observer cannot load the engine video`);
  h.setHeroVisible(false);

  h.setEngineVisible(true);
  assert(h.engineVideo.hasAttribute('src'), `${route}: entering the engine loads its video source`);
  assert(!h.engineVideo.paused && h.engineVideo.plays === 1, `${route}: entering the engine starts playback`);

  h.setEngineVisible(false);
  assert(h.engineVideo.paused, `${route}: leaving the engine pauses playback`);

  h.setEngineVisible(true);
  h.document.hidden = true;
  h.document.visibilitychange();
  assert(h.engineVideo.paused, `${route}: hiding the document pauses the engine video`);

  h.document.hidden = false;
  h.document.visibilitychange();
  assert(!h.engineVideo.paused, `${route}: visible in-view engine may resume`);
  h.engineToggle.click();
  assert(h.engineVideo.paused, `${route}: explicit user pause wins over viewport visibility`);
  assert.equal(h.engineToggle.dataset.paused, 'true', `${route}: pause control exposes its state`);
  h.setEngineVisible(false);
  h.setEngineVisible(true);
  assert(h.engineVideo.paused, `${route}: user pause persists across observer transitions`);

  h.preference.matches = true;
  h.preference.change();
  assert(h.engineVideo.paused, `${route}: reduced motion pauses the engine video`);
  assert(!h.engineVideo.hasAttribute('src'), `${route}: reduced motion restores the poster-only state`);

  h = harness(html, true);
  h.setEngineVisible(true);
  assert(h.engineVideo.paused && !h.engineVideo.hasAttribute('src'), `${route}: reduced motion prevents initial loading/playback`);

  h = harness(html);
  h.context.setPane(1);
  assert(h.heroVideos.every(item => !item.hasAttribute('src')), `${route}: hidden hero remains poster-only`);
  h.setHeroVisible(true);
  assert(h.heroVideos[0].hasAttribute('src') && !h.heroVideos[1].hasAttribute('src'));
  h.context.setPane(2);
  assert(h.heroVideos[0].paused && !h.heroVideos[1].paused);
  h.setHeroVisible(false);
  assert(h.heroVideos.every(item => item.paused));
  h.preference.matches = true;
  h.preference.change();
  assert(h.heroVideos.every(item => !item.hasAttribute('src')));

  h = harness(html, true);
  h.setHeroVisible(true);
  h.context.setPane(1);
  h.context.tickHero(40000);
  assert.equal(h.context.seg, 1);
  assert(h.heroVideos.every(item => !item.hasAttribute('src')));

  h = harness(html);
  h.heroVideos[0].reject = true;
  h.setHeroVisible(true);
  h.context.setPane(1);
  assert(!h.heroVideos[0].hasAttribute('src') && h.heroVideos[0].dataset.static === 'true');
  h.context.tickHero(40000);
  assert.equal(h.context.seg, 2); // Rejection cannot stall the carousel.

  h = harness(html, false, false);
  h.context.setPane(1);
  assert(h.heroVideos.every(item => !item.hasAttribute('src')));
  assert(!h.engineVideo.hasAttribute('src') && h.engineVideo.paused);

  console.log(`PASS ${route}: hero + engine lazy lifecycle, controls, motion preference, fixed video ratio`);
}

for (const dir of ['pages', 'en/pages']) {
  const files = fs.readdirSync(path.join(root, dir)).filter(file => file.endsWith('.html'));
  for (const file of files) {
    assert(!/wenshu-ai-(?:reception|plan-generation)\.mp4/.test(fs.readFileSync(path.join(root, dir, file), 'utf8')));
  }
  console.log(`PASS ${dir}: ${files.length} generated pages, no references to either hero video`);
}
