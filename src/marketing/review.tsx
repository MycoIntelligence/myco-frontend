import {useRef,useState} from 'react'
import {type MotionValue,motion, useInView, useReducedMotion, useScroll, useSpring, useTransform, useVelocity} from 'motion/react'
import {reviewAnimations} from './review-animation-data'

const sceneSteps = [
  {
    label: 'Requirement check',
    imageDescription: 'The receipt shows the wrong total. Jira ticket CHECKOUT-17 says the receipt total must match the amount charged. Line 40 returns the subtotal before the discount.',
    headline: 'Did the change match the intended behaviour?',
    copy: 'Myco checks the implementation against your requirements, whether they’re in a PRD, docs, or Jira. Here, the amount charged is correct, but the receipt still shows the subtotal.',
  },
  {
    label: 'Implementation bug',
    imageDescription: 'An explicit zero discount gets replaced. When the requested discount is 0, line 20 falls back to the default discount. A zero discount should be preserved.',
    headline: 'Catch the input that breaks the logic',
    copy: 'Myco follows the value through the change. A discount of zero falls through to the default, giving a customer a discount they didn’t request.',
  },
  {
    label: 'Cross-repo regression',
    imageDescription: 'Myco comments on line 32 of the checkout pull request, where the producer renames totalCents to amountCents. It cites line 26 of the billing worker, which still reads totalCents.',
    headline: 'Follow the change into the next repo',
    copy: 'The checkout service renames a payment field. Myco traces the event to the billing worker, which still reads the old name.',
  },
  {
    label: 'Potential security issue',
    imageDescription: 'The public receipt includes internal costs. Line 53 adds internalCost to the customer-facing response. The public receipt only needs the total.',
    headline: 'See what the response would expose.',
    copy: 'Myco flags a field that belongs in internal records when it appears in the customer-facing receipt.',
  },
] as const

const implementationCases = [
  {
    name: 'Same-repo regression',
    headline: 'The new feature works. What else changed?',
    copy: 'A new checkout summary correctly uses whole-dollar prices, but it changes a shared formatter. Myco follows the change to the existing receipt in the same repository, where $19.99 now displays as $20.00.',
    video: '/animations/same-repo-regression.mp4',
  },
  {name: 'Zero discount', headline: sceneSteps[1].headline, copy: sceneSteps[1].copy, video: '/animations/implementation-bug.mp4'},
] as const

const securityCases = [
  {
    name: 'Exposed credentials',
    headline: 'Spot credentials before they ship.',
    copy: 'A checkout integration adds a private service credential to tracked configuration. Myco flags the file so the reviewer can remove the value and rotate it if it was real.',
    video: '/animations/exposed-credentials.mp4',
  },
  {
    name: 'Password in logs',
    headline: 'Keep passwords out of logs.',
    copy: 'New sign-in diagnostics capture the full request body. Myco flags that the password would be included in the diagnostic logs.',
    video: '/animations/password-in-logs.mp4',
  },
  {
    name: 'VNet access',
    headline: 'Catch network rules that widen access.',
    copy: 'A deployment change broadens an inbound rule for a private checkout service. Myco flags the expanded source scope so the reviewer can check it against the intended network boundary.',
    video: '/animations/vnet-access.mp4',
  },
  {name: 'Sensitive response', headline: sceneSteps[3].headline, copy: sceneSteps[3].copy, video: '/animations/potential-security-issue.mp4'},
] as const

type ReviewExample = {
  name: string
  headline: string
  copy: string
  video: string
}

function ReviewAnimation({index}: {index:number}) {
  const figure = useRef<HTMLElement>(null)
  const inView = useInView(figure, {amount:.25})
  const reducedMotion = useReducedMotion()
  const asset = reviewAnimations[index]
  return <figure className="review-animation" ref={figure}>
    <img src={inView && !reducedMotion ? asset.gif : asset.poster}
      alt={sceneSteps[index].imageDescription}
      width={1200} height={660} />
  </figure>
}

export function ReviewSection() {
  const {scrollY} = useScroll()
  const speed = useSpring(useVelocity(scrollY), {damping:36, stiffness:230})
  const drift = useTransform(speed, [-1500, 0, 1500], [5, 0, -5])

  return <section className="review-story" id="review" aria-labelledby="review-title">
    <div className="story-heading">
      <h2 id="review-title">What could break<br/> <em>if the PR ships?</em></h2>
      <p>See what Myco checks before merge through examples from a checkout workflow.</p>
    </div>
    <ol className="story-chapters">
      {sceneSteps.map((scene,index) => (
        <ReviewChapter key={scene.label} index={index} drift={drift} />
      ))}
    </ol>
  </section>
}

function ReviewChapter({index,drift}: {index:number; drift:MotionValue<number>}) {
  const reducedMotion = useReducedMotion()
  const chapter = useRef<HTMLLIElement>(null)
  const inView = useInView(chapter, {amount:.25})
  const [active,setActive] = useState(0)
  const [controlsFocused,setControlsFocused] = useState(false)
  const scene = sceneSteps[index]
  const cases: readonly ReviewExample[] | undefined = index===1 ? implementationCases : index===3 ? securityCases : undefined
  const example = cases?.[active]
  function advanceExample() {
    if (!cases || !inView || reducedMotion || controlsFocused) return
    setActive(current => (current + 1) % cases.length)
  }

  return <li className="story-chapter" ref={chapter} data-text-only={Boolean(example && reducedMotion)}>
    <div className="story-copy">
      <p className="story-label">{scene.label}</p>
      <div aria-live={controlsFocused ? 'polite' : undefined}>
        <h3>{example?.headline ?? scene.headline}</h3>
        <p>{example?.copy ?? scene.copy}</p>
      </div>
      {cases && <div className="review-example-options" role="group" aria-label={scene.label + ' examples'}
        onFocus={event=>setControlsFocused(event.target.matches(':focus-visible'))}
        onBlur={event=>{
          if (!event.currentTarget.contains(event.relatedTarget)) setControlsFocused(false)
        }}>
        {cases.map(({name},caseIndex) => (
          <button key={name} type="button" aria-pressed={active===caseIndex} onClick={()=>setActive(caseIndex)}>
            {name}
          </button>
        ))}
      </div>}
    </div>
    {(!example || !reducedMotion) && <motion.div className="story-visual"
      initial={reducedMotion ? false : 'waiting'}
      whileInView="arrived"
      viewport={{once:true,amount:.24}}
      variants={{waiting:{opacity:.58},arrived:{opacity:1}}}
      transition={{duration:reducedMotion ? 0 : .38}}>
      <motion.div className="scene-motion" style={{y: reducedMotion ? 0 : drift}}
        variants={{waiting:{opacity:.65,scale:.96},arrived:{opacity:1,scale:1}}}
        transition={{duration:reducedMotion ? 0 : .45,ease:'easeOut'}}>
        {example
          ? <figure className="review-animation">
              <video key={example.video} src={inView ? example.video : undefined}
                aria-label={example.copy} width={1200} height={660}
                autoPlay muted playsInline loop={controlsFocused} onEnded={advanceExample} />
            </figure>
          : <ReviewAnimation index={index}/>}
      </motion.div>
    </motion.div>}
  </li>
}
