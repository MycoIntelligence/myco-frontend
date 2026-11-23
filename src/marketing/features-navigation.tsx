import Link from "next/link"
import {useEffect, useRef, useState} from 'react'

export const featureLinks = [
  {slug:'pr-review',name:'PR Review'},
  {slug:'testing',name:'Testing & Test Generation'},
  {slug:'pre-prod-validation',name:'Pre-Prod Validation'},
  {slug:'production-monitoring',name:'Production Monitoring'},
] as const

export function FeaturesNavigation({active=false}: {active?:boolean}) {
  const [mode,setMode] = useState<'hover'|'explicit'|null>(null)
  const open = mode!==null
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    function closeOnOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setMode(null)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMode(null)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown',closeOnOutside)
    document.addEventListener('keydown',closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown',closeOnOutside)
      document.removeEventListener('keydown',closeOnEscape)
    }
  },[open])

  return <div className="features-menu" ref={root}
    onPointerEnter={event=>{
      if(event.pointerType==='mouse') setMode(current=>current??'hover')
    }}
    onPointerLeave={event=>{
      if(event.pointerType!=='mouse'||(root.current?.contains(document.activeElement)&&document.activeElement!==trigger.current)) return
      setMode(current=>current==='hover'?null:current)
    }}
    onBlur={event=>{
      if(!event.currentTarget.contains(event.relatedTarget)) setMode(null)
    }}>
    <button type="button" ref={trigger} className="features-trigger" aria-expanded={open}
      aria-controls="header-feature-links" data-active={active || undefined}
      onClick={()=>setMode(current=>current==='explicit'?null:'explicit')}>
      Features
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    <div className="features-menu-flyout" data-open={open} inert={!open}>
      <ul className="features-menu-panel" id="header-feature-links">
        {featureLinks.map(feature=><li key={feature.slug}><Link href={'/features/'+feature.slug+'/'}>{feature.name}</Link></li>)}
      </ul>
    </div>
  </div>
}
