import {useEffect, useState} from 'react'
import {AnimatePresence, motion, useReducedMotion} from 'motion/react'

const logos = [
  {file:'smile', width:38},
  {file:'inure-ai', width:100},
  {file:'cred', width:35},
  {file:'spacex', width:126},
  {file:'google', width:98},
  {file:'exl', width:74},
  {file:'spinny', width:106},
]

export function PilotLogos() {
  const [offset, setOffset] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setInterval(() => setOffset(current => (current + 2) % logos.length), 3600)
    return () => window.clearInterval(timer)
  }, [reduceMotion])

  const ordered = logos.map((_, index) => logos[(index + offset) % logos.length])

  return <section id="pilot-logos" className="pilot-logos" aria-labelledby="pilot-logos-title">
    <h2 id="pilot-logos-title">Trusted by engineers at</h2>
    <span className="sr">Inure AI, CRED, SpaceX, Google, EXL, Spinny, and the company represented by the smile mark.</span>
    <div className="pilot-logo-grid" aria-hidden="true">
      {ordered.map(({file,width},index) => <div className="pilot-logo-cell" key={index}>
        <AnimatePresence initial={false}>
          <motion.img
            key={file}
            src={'/logos/'+file+'.png'}
            alt=""
            style={{width}}
            initial={{opacity:0, y:4}}
            animate={{opacity:.62, y:0}}
            exit={{opacity:0, y:-4}}
            transition={{duration:.38, delay:index*.035, ease:'easeInOut'}}
          />
        </AnimatePresence>
      </div>)}
    </div>
  </section>
}
