import React from "react";
import { diff } from "../mock";
import ResponsiveFlow from "./ResponsiveFlow";
export default function ContextEngine() {
  return <section className="wrap context-section" aria-labelledby="context-section-title">
    <header className="context-section__header"><span className="diff-system__rule" aria-hidden="true"/><h2 className="display" id="context-section-title">A diff is not the whole system.</h2><p>{diff.body}</p></header>
    <div className="context-section__visual"><ResponsiveFlow /></div>
    <ol className="diff-system__ledger">{diff.cards.map(stage=><li key={stage.num}><span className="diff-system__index">{stage.num}</span><span className="diff-system__label">{stage.tag}</span><span className="diff-system__mark" aria-hidden="true"/><p>{stage.body}</p></li>)}</ol>
  </section>;
}
