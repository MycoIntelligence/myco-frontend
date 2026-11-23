import {useRef} from 'react'
import {motion, useInView, useReducedMotion, useScroll, useSpring, useTransform, useVelocity} from 'motion/react'
import {reviewAnimations} from './review-animation-data'

const sceneSteps = [
  {
    label: 'Requirement check',
    imageDescription: 'The receipt shows the wrong total. Jira ticket CHECKOUT-17 says the receipt total must match the amount charged. Line 40 returns the subtotal before the discount.',
    headline: 'Did the change do what the ticket asked?',
    copy: 'Myco compares the implementation with the agreed behavior. Here, the amount charged is correct, but the receipt still shows the subtotal.',
  },
  {
    label: 'Implementation bug',
    imageDescription: 'An explicit zero discount gets replaced. When the requested discount is 0, line 20 falls back to the default discount. A zero discount should be preserved.',
    headline: 'Catch the input that breaks the logic.',
    copy: 'Myco follows the value through the change. A discount of zero falls through to the default, giving a customer a discount they didn’t request.',
  },
  {
    label: 'Cross-repo regression',
    imageDescription: 'Myco comments on line 32 of the checkout pull request, where the producer renames totalCents to amountCents. It cites line 26 of the billing worker, which still reads totalCents.',
    headline: 'Follow the change into the next repo.',
    copy: 'The checkout service renames a payment field. Myco traces the event to the billing worker, which still reads the old name.',
  },
  {
    label: 'Potential security issue',
    imageDescription: 'The public receipt includes internal costs. Line 53 adds internalCost to the customer-facing response. The public receipt only needs the total.',
    headline: 'See what the response would expose.',
    copy: 'Myco flags a field that belongs in internal records when it appears in the customer-facing receipt.',
  },
] as const

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
  const reducedMotion = useReducedMotion()
  const {scrollY} = useScroll()
  const speed = useSpring(useVelocity(scrollY), {damping:36, stiffness:230})
  const drift = useTransform(speed, [-1500, 0, 1500], [5, 0, -5])

  return <section className="review-story" id="review" aria-labelledby="review-title">
    <div className="story-heading">
      <span>PR review</span>
      <h2 id="review-title">What could break<br/> <em>if this PR ships?</em></h2>
      <p>See what Myco checks before merge through four examples from a checkout workflow.</p>
    </div>
    <ol className="story-chapters">
      {sceneSteps.map((scene,index) => <li className="story-chapter" key={scene.label}>
        <div className="story-copy">
          <p className="story-label">{scene.label}</p>
          <h3>{scene.headline}</h3>
          <p>{scene.copy}</p>
        </div>
        <motion.div className="story-visual"
          initial={reducedMotion ? false : 'waiting'}
          whileInView="arrived"
          viewport={{once:true,amount:.24}}
          variants={{waiting:{opacity:.58},arrived:{opacity:1}}}
          transition={{duration:reducedMotion ? 0 : .38}}>
          <motion.div className="scene-motion" style={{y: reducedMotion ? 0 : drift}}
            variants={{waiting:{opacity:.65,scale:.96},arrived:{opacity:1,scale:1}}}
            transition={{duration:reducedMotion ? 0 : .45,ease:'easeOut'}}>
            <ReviewAnimation index={index}/>
          </motion.div>
        </motion.div>
      </li>)}
    </ol>
  </section>
}
