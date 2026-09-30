import React from "react";
import { diff } from "../mock";

export default function DiffSection() {
  return (
    <div className="wrap diff-system-wrap" data-diff-redesign-applied="true">
      <section className="diff-system" aria-labelledby="diff-system-title">
        <div className="diff-system__top">
          <header className="diff-system__intro">
            <span className="diff-system__rule" aria-hidden="true" />
            <h2 className="display" id="diff-system-title"><span>A diff is not </span><span>the whole system.</span></h2>
            <p>{diff.body}</p>
          </header>
        </div>
        <ol className="diff-system__ledger">
          {diff.cards.map(stage => (
            <li key={stage.num}>
              <span className="diff-system__index">{stage.num}</span>
              <span className="diff-system__label">{stage.tag}</span>
              <span className="diff-system__mark" aria-hidden="true" />
              <p>{stage.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
