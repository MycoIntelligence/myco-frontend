import type {ReactNode} from 'react'
import {DitherField} from './dither-local'

const palette=['#122638','#215987','#74bbf4'] as const

export function DitherFlow({children,className}: {children:ReactNode;className?:string}) {
  return <div className={className?'hero-review-flow '+className:'hero-review-flow'}>
    <DitherField className="flow-dither" pattern="horizon" color={palette} intensity={0.60} pointerIntensity={0.46} aria-hidden="true"/>
    {children}
  </div>
}
