const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../hero-motion.js'), 'utf8');

function setup({ reduce = false, height = 450, viewport = 900, intersection = true } = {}) {
  const classes = new Set();
  const timers = new Map();
  const winEvents = {}, docEvents = {}, buttonEvents = {}, attrs = {};
  let sequence = 0;
  let top = 150;
  const media = { matches: reduce, addEventListener: (_, fn) => { media.change = fn; } };
  const figure = { getBoundingClientRect: () => ({ top, bottom: top + height, height }) };
  const trace = { offsetWidth: 450, classList: {
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name)),
  } };
  const button = {
    setAttribute: (key, value) => { attrs[key] = value; },
    addEventListener: (key, fn) => { buttonEvents[key] = fn; },
  };
  const document = {
    hidden: false,
    fonts: { ready: { then: fn => fn() } },
    getElementById: id => id === 'hero-trace' ? trace : { offsetHeight: 84 },
    querySelector: selector => selector === '.hero-evidence' ? figure : button,
    addEventListener: (key, fn) => { docEvents[key] = fn; },
  };
  const window = {
    innerHeight: viewport,
    matchMedia: () => media,
    addEventListener: (key, fn) => { winEvents[key] = fn; },
  };
  if (intersection) window.IntersectionObserver = true;
  vm.runInNewContext(source, {
    document, window, IntersectionObserver: class { observe() {} },
    setTimeout: (fn, ms) => { timers.set(++sequence, { fn, ms }); return sequence; },
    clearTimeout: id => timers.delete(id),
  });
  const tick = ms => {
    for (const [id, timer] of [...timers]) {
      if (timer.ms === ms) { timers.delete(id); timer.fn(); }
    }
  };
  return { classes, timers, winEvents, docEvents, buttonEvents, attrs, media, document, tick, move: value => { top = value; } };
}

test('plays once, ignores stacked replays, then allows an explicit replay', () => {
  const s = setup();
  assert(s.classes.has('hero-waiting'));
  s.tick(250);
  assert(s.classes.has('hero-playing'));
  assert.equal(s.attrs['aria-disabled'], 'true');
  s.buttonEvents.click();
  assert.equal(s.timers.size, 1);
  s.tick(3050);
  assert.equal(s.classes.size, 0);
  s.winEvents.scroll();
  assert.equal(s.timers.size, 0);
  s.buttonEvents.click();
  assert(s.classes.has('hero-playing'));
});
test('reduced motion starts static and interrupts an active animation', () => {
  const staticState = setup({ reduce: true });
  staticState.buttonEvents.click();
  assert.equal(staticState.classes.size, 0);
  assert.equal(staticState.timers.size, 0);
  const s = setup();
  s.tick(250);
  s.media.matches = true;
  s.media.change();
  assert.equal(s.classes.size, 0);
  assert.equal(s.attrs['aria-disabled'], 'true');
});
test('short viewports and unsupported observation retain a completed trace', () => {
  for (const options of [{ height: 800, viewport: 700 }, { intersection: false }]) {
    const s = setup(options);
    assert.equal(s.classes.size, 0);
    assert.equal(s.timers.size, 0);
    s.buttonEvents.click();
    assert(s.classes.has('hero-playing'));
  }
});
test('resize and backgrounding finish an active sequence', () => {
  const s = setup();
  s.tick(250);
  s.winEvents.resize();
  assert.equal(s.classes.size, 0);
  s.buttonEvents.click();
  s.document.hidden = true;
  s.docEvents.visibilitychange();
  assert.equal(s.classes.size, 0);
});
test('backgrounding cancels a pending start; returning resumes visibility checks', () => {
  const s = setup();
  s.document.hidden = true;
  s.docEvents.visibilitychange();
  assert.equal(s.timers.size, 0);
  s.document.hidden = false;
  s.docEvents.visibilitychange();
  s.tick(250);
  assert(s.classes.has('hero-playing'));
});
test('fast scrolling past a pending trace leaves the completed state', () => {
  const s = setup();
  s.move(-80);
  s.winEvents.scroll();
  assert.equal(s.classes.size, 0);
  assert.equal(s.timers.size, 0);
  s.move(150);
  s.winEvents.scroll();
  assert.equal(s.timers.size, 0);
});
