import {useEffect, useRef, useState} from 'react'
import {liveStyles, liveSections} from './live-section-data'
import {connectSmoothCursor} from './cursor-frame'

const darkFrame = `
@font-face{font-family:Geist;src:url(/marketing/Geist.woff2) format("woff2");font-weight:100 900;font-display:swap}
:root{--font-body:Geist,sans-serif;--font-display:var(--font-body);--font-serif:var(--font-body);--editorial-font:var(--font-body);--font-mono:var(--font-body)}
html,body,.App,code,pre,kbd,samp{font-family:var(--font-body)}
.integration-workflow .eyebrow,.security-editorial .eyebrow,.security-editorial__row h3,.integration-workflow .diagram-card :is(strong,p,small),.integration-workflow .diagram-engine strong{font-family:var(--font-body)!important}
:root{color-scheme:dark;--bg:#090a0c;--bg-soft:#11151b;--panel:#141c27;--panel-cool:#142132;--ink:#f4f7fc;--ink-soft:#bdc8d6;--muted:#a8b7c9;--border:#263342;--border-strong:#436383;--wire:#5887b2;--accent:#9bcfff;--accent-dark:#9bcfff;--verify:#9bcfff}
html,body,.App{background:#090a0c!important;color:#f4f7fc!important}
#integrate::after{content:none!important}
.integration-workflow,.security-editorial{color:var(--ink)!important}
.integration-workflow__header h2,.security-editorial h2,.security-editorial h3,.integration-workflow__tool strong,.integration-workflow__repository strong{color:var(--ink)!important}
.integration-workflow__header p,.security-editorial p,.integration-workflow__tool>span,.vertical-diagram p{color:var(--ink-soft)!important}
.integration-workflow .eyebrow,.security-editorial .eyebrow,.diagram-card small{color:var(--accent)!important}
.integration-workflow__header h2,
.security-editorial__intro h2 {
  font-family: var(--font-body) !important;
  font-size: clamp(36px, 5.5vw, 64px) !important;
  font-weight: 700 !important;
  line-height: 1.03 !important;
  letter-spacing: -.064em !important;
  color: #f6f8fc !important;
  margin: 0 !important;
  text-wrap: balance;
}
.integration-workflow__header h2 span:last-child,
.security-editorial__intro h2 span:last-child { color: var(--accent); }
.integration-workflow__header p,
.security-editorial__intro > p,
.security-editorial__row p {
  font-size: 17px !important;
  line-height: 1.5 !important;
  color: #a6adb7 !important;
}
.security-editorial__intro > p { margin: 18px 0 0; }
.security-editorial__row h3 {
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -.047em;
}
.integration-workflow__repository,.integration-workflow__logo,.integration-workflow__tool{background:#090a0c!important}
.integration-workflow__wires path,.vertical-diagram path{stroke:#5887b2!important}
.integration-workflow__logo img{mix-blend-mode:normal;filter:none}
.integration-workflow__repository img,.integration-workflow__tool.is-custom img,.vertical-diagram>.diagram-card img,.vertical-diagram .diagram-grid>.diagram-card:last-child img,.diagram-engine img{filter:brightness(0) saturate(100%) invert(81%) sepia(20%) saturate(1043%) hue-rotate(180deg)}
.vertical-diagram{color:var(--ink)!important}
.vertical-diagram .diagram-card,.diagram-engine img{background:#131c29!important;border-color:#344964!important}
.diagram-engine img{filter:none;background:#1b2e42!important;object-fit:contain}
#security>.security-editorial{row-gap:22px}
.security-editorial__intro{grid-column:1;grid-row:1}
.security-editorial__rows{grid-column:2;grid-row:1 / span 2}
.security-editorial__more{grid-column:1;grid-row:2;align-self:end;justify-self:start;display:inline-flex;align-items:center;gap:10px;padding:10px 13px;border:1px solid #334d67;border-radius:8px;background:#152236;color:var(--accent)!important;font-size:14px;font-weight:600;line-height:1.35;text-decoration:none}
.security-editorial__more:hover{background:#203951}
.security-editorial__more:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
@media(max-width:650px){
  .security-editorial__intro,.security-editorial__rows,.security-editorial__more{grid-column:auto;grid-row:auto}
}
`

const frameReset = 'html,body{margin:0;overflow:hidden}#root{min-height:0}.live-measure{display:flow-root;min-height:0!important}.live-spacer{display:none!important}html[data-smooth-cursor],html[data-smooth-cursor] *{cursor:none!important}'

function LiveSection({kind}: {kind:'integration'|'security'}) {
  const section = liveSections[kind]
  const iframe = useRef<HTMLIFrameElement>(null)
  const observer = useRef<ResizeObserver|null>(null)
  const disconnectCursor = useRef<(() => void)|null>(null)
  const [height,setHeight] = useState(1)

  function observeHeight() {
    observer.current?.disconnect()
    disconnectCursor.current?.()
    const frame = iframe.current
    const doc = frame?.contentDocument
    const wrap = doc?.querySelector('.live-measure')
    if (!frame || !doc || !wrap) return
    disconnectCursor.current = connectSmoothCursor(frame, doc)
    function sync() {
      if (!wrap) return
      const diagram = wrap.querySelector('.vertical-diagram')
      if (diagram && diagram.getBoundingClientRect().width > 0) {
        const origin = diagram.getBoundingClientRect()
        const source = diagram.querySelector('.diagram-card')!
        const engine = diagram.querySelector('.diagram-engine')!
        const tools = [...diagram.querySelectorAll('.diagram-grid .diagram-card')]
        const edge = (node: Element, fromBottom: boolean) => {
          const bounds = node.getBoundingClientRect()
          return [bounds.left+bounds.width/2-origin.left,(fromBottom ? bounds.bottom : bounds.top)-origin.top]
        }
        const paths = diagram.querySelectorAll('svg > path')
        const links = [[source,engine],...tools.map(tool => [engine,tool])]
        for (const [index,[from,to]] of links.entries()) {
          const [x1,y1] = edge(from,true), [x2,y2] = edge(to,false)
          const cy = (y1+y2)/2
          paths[index]?.setAttribute('d',`M${x1} ${y1} C${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`)
        }
      }
      setHeight(Math.ceil(wrap.getBoundingClientRect().height))
    }
    sync()
    observer.current = new ResizeObserver(sync)
    observer.current.observe(wrap)
  }

  useEffect(() => () => {
    observer.current?.disconnect()
    disconnectCursor.current?.()
  }, [])
  return <section className="live-home-section" id={kind} aria-label={section.title}>
    <iframe ref={iframe} onLoad={observeHeight} title={section.title} style={{height}} srcDoc={`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${liveStyles}\n${darkFrame}\n${frameReset}</style><div id="root"><div class="App live-measure"><div class="live-spacer"></div><div class="wrap" id="${section.id}">${section.markup}</div><div class="live-spacer"></div></div></div></html>`} />
  </section>
}

export function LiveWorkflowSection() { return <LiveSection kind="integration" /> }
export function LiveSecuritySection() { return <LiveSection kind="security" /> }
