import {FeatureWalkthrough} from './feature-walkthrough'

const steps=['Rollout','Threshold breach','Myco finding','Owner notified']
const latency = [245, 261, 236, 252, 244, 245, 251, 277, 330, 415, 510, 572]
const cpu = [41, 39, 42, 40, 41, 41, 40, 42, 41, 40, 42, 41]
const rolloutMinute = 5
const alertMinute = 9
const ownerNotifiedMinute = 11
const observationMinutes = [rolloutMinute, alertMinute, 10, ownerNotifiedMinute]
const latencyLimit = 350
const release = 'v2.9.0'
const baseline = 'v2.8.3'
const x = (minute:number) => 35 + 262 * minute / ownerNotifiedMinute
const timeAt = (minute:number) => `14:${String(minute-rolloutMinute).padStart(2,'0')}`

function chartPath(values:number[], first:number, last:number, y:(value:number)=>number) {
  return values.slice(first,last+1).map((value,index)=>
    `${index===0?'M':'L'}${x(first+index)} ${y(value)}`
  ).join(' ')
}

function Metric({isLatency,progress}:{isLatency:boolean;progress:number}){
  const throughMinute=observationMinutes[progress]
  const hasBreach=throughMinute>=alertMinute
  const values=isLatency?latency:cpu
  const min=isLatency?100:0
  const max=isLatency?700:100
  const y=(value:number)=>93-71*(value-min)/(max-min)
  const reading=values[throughMinute]
  const readingLabel=isLatency?`Checkout p95 latency: ${reading} milliseconds`:`CPU utilization: ${reading} percent`
  return <section className="monitor-metric">
    <div className="monitor-metric-head">
      <h3>{isLatency?'Checkout latency · p95':'CPU utilization'}</h3>
      <span className={isLatency&&hasBreach?'monitor-danger':''}>{reading}{isLatency?' ms':'%'}</span>
    </div>
    <svg viewBox="0 0 312 114" role="img" aria-label={`${readingLabel} as of ${timeAt(throughMinute)} UTC.`}>
      {[22,57.5,93].map((y,i)=><g key={y}><path className="monitor-gridline" d={`M35 ${y}H297`}/><text x="2" y={y+3}>{(isLatency?['700','400','100']:['100%','50%','0%'])[i]}</text></g>)}
      <path className="monitor-deploy-line" d={`M${x(rolloutMinute)} 20V93`}/>
      <text x={x(rolloutMinute)} y="13" textAnchor="middle">{release}</text>
      {isLatency&&<><path className="monitor-threshold" d={`M35 ${y(latencyLimit)}H297`}/><text className="monitor-threshold-text" x="295" y={y(latencyLimit)+15} textAnchor="end">350 ms threshold</text></>}
      <path className="monitor-trace" d={chartPath(values,0,rolloutMinute,y)}/>
      {hasBreach&&<path pathLength="1" className={'monitor-trace monitor-trace-new'+(isLatency?' monitor-trace-breach':'')} d={chartPath(values,rolloutMinute,throughMinute,y)}/>}
      {hasBreach&&<circle className={isLatency?'monitor-point monitor-point-breach':'monitor-point'} cx={x(throughMinute)} cy={y(reading)} r="3.5"/>}
      {isLatency&&throughMinute>alertMinute&&<circle className="monitor-point monitor-point-breach" cx={x(alertMinute)} cy={y(values[alertMinute])} r="3"/>}
      <text x={x(0)} y="108">13:55</text><text x={x(rolloutMinute)} y="108" textAnchor="middle">14:00</text><text x={x(ownerNotifiedMinute)} y="108" textAnchor="end">{timeAt(ownerNotifiedMinute)}</text>
    </svg>
  </section>
}

export function ProductionDemo(){
  return <FeatureWalkthrough label="Illustrative Myco production monitoring walkthrough" context="Production / Checkout API" title="Release investigation" steps={steps}>
    {progress=><div className="monitor-body">
      <div className="monitor-release">
        <span><strong>{release}</strong> rolled out at 14:00 UTC · Data through {timeAt(observationMinutes[progress])} UTC</span>
        <span className={progress>=1?'monitor-alert':''}>{progress>=1?`p95 alert · ${timeAt(alertMinute)} UTC`:'Monitoring checkout'}</span>
      </div>
      <div className="monitor-metrics"><Metric isLatency progress={progress}/><Metric isLatency={false} progress={progress}/></div>
      <div className="monitor-handoff">
        <section className="monitor-card monitor-finding" data-visible={progress>=2} inert={progress<2}>
          <div className="monitor-card-heading">
            <img src="/animations/monitor-myco-dark.png" alt="" width="22" height="22"/>
            <h3>Myco finding</h3><span>Likely cause</span>
          </div>
          <strong>Shipping quote cache misses after rollout</strong>
          <p>Slow traces show shipping quote cache misses followed by rate-service requests. CPU stayed near baseline.</p>
          <div className="monitor-evidence"><code>PR #231</code><code>shipping/cache.ts:42</code></div>
        </section>
        <section className="monitor-card monitor-slack" data-visible={progress>=3} inert={progress<3}>
          <div className="monitor-card-heading">
            <img src="/animations/monitor-slack.svg" alt="Slack" width="18" height="18"/>
            <h3>#checkout-oncall</h3><span>{timeAt(ownerNotifiedMinute)} UTC</span>
          </div>
          <strong>Myco <small>APP</small></strong>
          <p><b>@checkout-oncall</b> Checkout p95 crossed 350 ms. Compare cache hit rates on {release} and {baseline}.</p>
        </section>
      </div>
    </div> }
  </FeatureWalkthrough>
}
