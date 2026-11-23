import type {ReactNode} from 'react'

type TerminalProps = {
  title: string
  label: string
  status?: string
  failed?: boolean
  children: ReactNode
}

export function Terminal({title, label, status, failed, children}: TerminalProps) {
  return <section className="demo-terminal" aria-label={label}>
    <div className="demo-terminal-bar">
      <span className="demo-terminal-lights" aria-hidden="true"><i/><i/><i/></span>
      <span className="demo-terminal-title">{title}</span>
      {status && <span className={failed ? 'quality-fail' : undefined}>{status}</span>}
    </div>
    <div className="demo-terminal-body">{children}</div>
  </section>
}
