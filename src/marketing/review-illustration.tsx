import {
  BellRing, ClipboardList, Database, FileDiff, ListChecks,
  RotateCcw, Route, TableProperties, Activity,
} from 'lucide-react'

const featureSymbols = {
  coverage: ListChecks,
  testPlan: TableProperties,
  testCase: ClipboardList,
  scenario: Route,
  stagingData: Database,
  rerun: RotateCcw,
  releaseIntent: FileDiff,
  rollout: Activity,
  alert: BellRing,
}

export type FeatureSymbol = keyof typeof featureSymbols

export function FeatureIllustration({kind}: {kind: FeatureSymbol}) {
  const Symbol = featureSymbols[kind]
  return <svg className="pr-story-review-icon" viewBox="0 0 144 144" aria-hidden="true" strokeLinejoin="round">
    <path d="M18 88 72 61l54 27v9l-54 28-54-28Z" fill="#152437" stroke="#507697"/>
    <path d="M18 88 72 61l54 27-54 28Z" fill="#203b55" stroke="#86afce"/>
    <path d="M36 87 72 69l36 18-36 18Z" fill="#284b68" stroke="#709cbe"/>
    <ellipse cx="72" cy="89" rx="21" ry="7" fill="#102033" opacity=".7"/>
    <Symbol x={43} y={27} width={58} height={58} color="#a9d6fa" strokeWidth={1.1}/>
  </svg>
}

export function ReviewIllustration({kind}: {kind: 'requirements' | 'dependencies'}) {
  return <svg className="pr-story-review-icon" viewBox="0 0 144 144" aria-hidden="true" strokeLinejoin="round" strokeLinecap="round">
    <path d="M18 86 72 58l54 28v9l-54 29-54-29Z" fill="#152437" stroke="#507697"/>
    <path d="M18 86 72 58l54 28-54 29Z" fill="#203b55" stroke="#86afce"/>
    {kind === 'requirements' ? <>
      <path d="M25 72 70 47l49 23-45 26Z" fill="#284b68" stroke="#a1c9e8"/>
      <path d="m42 72 29-16m-19 22 29-16m-19 22 22-12" fill="none" stroke="#9bc5e6"/>
      <circle cx="104" cy="77" r="16" fill="#192d42" stroke="#a1c9e8"/>
      <path d="m97 77 5 5 9-10" fill="none" stroke="#c7e5ff" strokeWidth="1.6"/>
    </> : <>
      <path d="M72 42v29m0 0L43 84m29-13 29 13" fill="none" stroke="#a1c9e8" strokeWidth="1.5"/>
      <path d="m52 35 20-11 20 11v13L72 59 52 48Z M28 83l15-8 15 8v9l-15 8-15-8Z M86 83l15-8 15 8v9l-15 8-15-8Z" fill="#203b55" stroke="#a1c9e8"/>
      <path d="m52 35 20 11 20-11M72 46v13M28 83l15 8 15-8m-15 8v9m43-17 15 8 15-8m-15 8v9" fill="none" stroke="#86afce"/>
    </>}
  </svg>
}
