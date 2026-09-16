const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../workflow-motion.js'), 'utf8');

function setup({ width = 1200, reduced = false, height = 844, supported = true } = {}) {
  let observer, mediaChange, frame, now = 0;
  const elements = {}, handlers = {};
  const stages = Array.from({ length: 4 }, () => ({ dataset: {} }));
  const ctx = new Proxy({}, {
    get: (o, key) => o[key] || ((...args) => assert(!args.some(v => typeof v === 'number' && !Number.isFinite(v)))),
    set: (o, key, value) => (o[key] = value, true)
  });
  const root = {
    querySelector: selector => elements[selector] || (elements[selector] = {
      dataset: {}, hidden: selector === '.ms-actions', setAttribute() {},
      addEventListener: (event, callback) => { handlers[selector] = callback; }
    }),
    querySelectorAll: () => stages
  };
  elements.canvas = { getContext: () => ctx };
  elements['.ms-map'] = { clientWidth: width - 40, clientHeight: width <= 800 ? 440 : 265 };
  const media = { matches: reduced, addEventListener: (_, callback) => { mediaChange = callback; } };
  const document = { hidden: false, getElementById: () => root, addEventListener: () => {} };
  const sandbox = {
    document, innerHeight: height, devicePixelRatio: 2,
    matchMedia: query => query.includes('reduce') ? media : { matches: width <= 800 },
    requestAnimationFrame: callback => { frame = callback; return 1; }
  };
  if (supported) {
    sandbox.IntersectionObserver = class { constructor(callback) { observer = callback; } observe() {} };
    sandbox.ResizeObserver = class { observe() {} };
  }
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox);
  return {
    elements, stages, document,
    visible: ratio => observer([{ intersectionRatio: ratio }]),
    click: name => handlers[`[data-control="${name}"]`](),
    reduce: () => { media.matches = true; mediaChange(); },
    advance: frames => { for (let i = 0; i < frames && frame; i++) { const callback = frame; frame = null; now += 16; callback(now); assert(stages.filter(s => s.dataset.active === 'true').length <= 1); } }
  };
}

for (const width of [1200, 801, 390, 320]) {
  test(`sequential autoplay, terminal hold and repeat at ${width}px`, () => {
    const run = setup({ width });
    assert.equal(run.elements['.ms-record'].dataset.terminal, 'true');
    run.visible(.8);
    run.advance(10);
    assert.equal(run.stages[0].dataset.active, 'true');
    run.advance(260);
    assert.equal(run.stages[1].dataset.active, 'true');
    run.advance(250);
    assert.equal(run.stages[2].dataset.active, 'true');
    run.advance(250);
    assert.equal(run.stages[3].dataset.active, 'true');
    run.advance(300);
    assert.equal(run.elements['.ms-record'].dataset.terminal, 'true');
    run.visible(0); run.visible(.9); run.advance(30);
    assert.equal(run.elements['.ms-record'].dataset.terminal, 'true');
    run.advance(300);
    assert.equal(run.stages[0].dataset.active, 'true');
    run.click('pause'); run.advance(500);
    assert.equal(run.stages[0].dataset.active, 'true');
    run.visible(0); run.visible(1); run.advance(500);
    assert.equal(run.stages[0].dataset.active, 'true');
    run.click('pause'); run.advance(260);
    assert.equal(run.stages[1].dataset.active, 'true');
  });
}
test('reduced motion and mid-run preference changes show completed evidence', () => {
  const staticRun = setup({ reduced: true });
  staticRun.visible(1); staticRun.advance(500);
  assert.equal(staticRun.elements['.ms-record'].dataset.terminal, 'true');
  const run = setup(); run.visible(1); run.advance(50); run.reduce();
  assert.equal(run.elements['.ms-record'].dataset.terminal, 'true');
  assert.equal(run.elements['[data-control="pause"]'].disabled, true);
});
test('offscreen pauses; short viewports autoplay; unsupported observers preserve markup', () => {
  const run = setup(); run.visible(1); run.advance(20); run.visible(0); run.advance(500);
  assert.equal(run.stages[0].dataset.active, 'true');
  const short = setup({ width: 390, height: 450 }); short.visible(1); short.advance(500);
  assert.equal(short.stages[1].dataset.active, 'true');
  const fallback = setup({ supported: false });
  assert.equal(fallback.elements['.ms-record'].dataset.terminal, undefined);
});
