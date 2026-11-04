// The desktop diagrams remain the source for the phone cards and report.
function node(tag, name, text) {
  const el = document.createElement(tag);
  el.className = name;
  if (text) el.textContent = text;
  return el;
}

function icon(src) {
  const image = node('img', 'diagram-icon');
  image.src = src;
  image.alt = '';
  return image;
}

function card(title, description, image, label) {
  const item = node('div', 'diagram-card');
  if (label) item.append(node('small', '', label));
  if (image) item.append(icon(image));
  item.append(node('strong', '', title), node('p', '', description));
  return item;
}

function grid(cards) {
  const group = node('div', 'diagram-grid');
  group.append(...cards);
  return group;
}

function engine() {
  const hub = node('div', 'diagram-engine');
  hub.append(icon('assets/myco-icon.svg'), node('strong', '', 'Myco engine'));
  return hub;
}

function report(label, title, description, file) {
  const output = card(title, description, null, label);
  output.classList.add('diagram-report');
  if (file) output.append(node('footer', '', file));
  return output;
}

function mount(original, parts, connections) {
  const diagram = node('div', 'vertical-diagram');
  const svgNS = 'http://www.w3.org/2000/svg';
  const wires = document.createElementNS(svgNS, 'svg');
  wires.setAttribute('aria-hidden', 'true');
  diagram.append(wires, ...parts);
  original.before(diagram);
  original.classList.add('desktop-diagram');
  function draw() {
    const bounds = diagram.getBoundingClientRect();
    if (!bounds.width) return;
    const paths = connections.map(([start, end]) => {
      const a = start.getBoundingClientRect();
      const b = end.getBoundingClientRect();
      const x = a.left + a.width / 2 - bounds.left;
      const y = a.bottom - bounds.top;
      const u = b.left + b.width / 2 - bounds.left;
      const v = b.top - bounds.top;
      const mid = (y + v) / 2;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M' + x + ' ' + y + ' C' + x + ' ' + mid + ' ' + u + ' ' + mid + ' ' + u + ' ' + v);
      return path;
    });
    wires.replaceChildren(...paths);
  }
  const observer = new ResizeObserver(draw);
  observer.observe(diagram);
  parts.forEach(part => observer.observe(part));
}

function prepare() {
  const flow = document.querySelector('[data-flow-preview]');
  const proof = document.querySelector('.workflow-proof__panel');
  const connect = document.querySelector('.integration-workflow__diagram');
  if (!flow?.querySelector('.flow-mobile') || !proof || !connect) return false;
  const sources = [...flow.querySelectorAll('.flow-mobile__sources li')].map(li =>
    card(li.querySelector('strong').textContent, li.querySelector('span').textContent, li.querySelector('img').src));
  const output = node('div', 'diagram-card compact-output');
  output.append(node('small', '', 'Structured output'));
  for (const row of flow.querySelectorAll('.flow-report__row')) {
    const severity = row.querySelector('.flow-report__severity')?.textContent;
    const entry = node('div', severity ? 'compact-entry' : 'compact-suggestion');
    const marker = node('span', 'compact-marker', severity || '↗');
    if (severity) marker.dataset.severity = severity;
    else marker.setAttribute('aria-label', 'Suggestion');
    entry.append(marker, node('span', '', row.querySelector('h5').textContent));
    output.append(entry);
  }
  const hub = engine();
  mount(flow, [grid(sources), hub, output], [...sources.map(s => [s, hub]), [hub, output]]);

  const request = card(proof.querySelector('.workflow-proof__panel-change').textContent, '',
    'assets/flow-pr.svg', proof.querySelector('.workflow-proof__panel-label').textContent);
  const evidence = [
    card('AgentRunner', 'Retries the tool call.', null, '01 / Code'),
    card('Tool approval', 'Requires a check.', null, '02 / Policy'),
    card('AGENT-12', 'Tool calls require approval after retry.', null, '03 / Requirement')
  ];
  const proofHub = engine();
  const finding = report('P1 / Validated finding', proof.querySelector('#workflow-finding-title').textContent,
    proof.querySelector('.workflow-proof__finding p').textContent);
  mount(proof, [request, grid(evidence), proofHub, finding],
    [[request,evidence[0]], [request,evidence[1]], ...evidence.map(e => [e, proofHub]), [proofHub,finding]]);

  const repository = card('Repository', '', 'assets/integration-repository.svg', 'Read only');
  const targets = [...connect.querySelectorAll('.integration-workflow__tool')].map(li =>
    card(li.querySelector('strong').textContent, li.querySelector('span').textContent, li.querySelector('img').src));
  const integrationHub = engine();
  mount(connect, [repository, integrationHub, grid(targets)],
    [[repository,integrationHub], ...targets.map(t => [integrationHub,t])]);
  return true;
}
if (!prepare()) {
  const observer = new MutationObserver(() => { if (prepare()) observer.disconnect(); });
  observer.observe(document.body, {childList:true, subtree:true});
}
