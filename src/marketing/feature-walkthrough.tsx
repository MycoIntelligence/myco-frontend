import {useEffect,useState,type ReactNode} from 'react'
import {useReducedMotion} from 'motion/react'

const stepDurations=[1900,2000,2100,3200]

type WalkthroughProps = {
  label:string
  context:string
  title:string
  steps:readonly string[]
  children:(step:number)=>ReactNode
}

export function FeatureWalkthrough({label,context,title,steps,children}:WalkthroughProps){
  const reduced=useReducedMotion()
  const [stage,setStage]=useState(0)
  const lastStep=steps.length-1
  const progress=reduced?lastStep:stage

  useEffect(()=>{
    if(reduced) return
    const timer=window.setTimeout(()=>{
      setStage((stage+1)%steps.length)
    },stepDurations[stage])
    return ()=>window.clearTimeout(timer)
  },[reduced,stage,steps.length])

  return <section className="monitor-demo" aria-label={label}>
    <header className="monitor-head">
      <div><span>{context}</span><h2>{title}</h2></div>
      <span className="monitor-example">Illustrative demo</span>
    </header>
    {children(progress)}
    {!reduced&&<footer className="monitor-controls">
      <div className="monitor-stages" role="group" aria-label="Walkthrough steps">
        {steps.map((label,i)=><button key={label} type="button" aria-pressed={i===progress} onClick={()=>setStage(i)}>{label}</button>)}
      </div>
    </footer>}
  </section>
}
