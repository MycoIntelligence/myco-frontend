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
                <img className="how-journey__art" src={`assets/how-${["layers", "overlap", "reason", "validate", "surface"][index]}.svg`} alt="" width="124" height="120" />
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
