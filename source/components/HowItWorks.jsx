import React from "react";
import Reveal from "./Reveal";
import { how } from "../mock";

export default function HowItWorks() {
  return (
    <div className="wrap how-journey-wrap" id="how">
      <section className="how-journey" aria-labelledby="how-journey-title">
        <header className="how-journey__header">
          <Reveal className="how-journey__eyebrow">{how.eyebrow}</Reveal>
          <div className="how-journey__headline">
            <Reveal><h2 className="display" id="how-journey-title">{how.titleLines.map((line, index) => <span key={index}>{line}</span>)}</h2></Reveal>
            <Reveal delay={90}><p>{how.body}</p></Reveal>
          </div>
        </header>
        <ol className="how-journey__steps">
          {how.steps.map((step, index) => (
            <li key={step.num} className={step.accent ? "is-reason" : ""}>
              <div className="how-journey__symbol" aria-hidden="true">
                {index === 0 && <span className="how-symbol how-symbol--layers"><i /><i /><i /></span>}
                {index === 1 && <span className="how-symbol how-symbol--overlap"><i /><i /></span>}
                {index === 2 && <span className="how-symbol how-symbol--reason"><i /></span>}
                {index === 3 && <span className="how-symbol how-symbol--validate"><i /><i /></span>}
                {index === 4 && <span className="how-symbol how-symbol--surface"><i /><i /><i /></span>}
              </div>
              <span className="how-journey__number">{step.num}</span>
              <h3 className="display">{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
