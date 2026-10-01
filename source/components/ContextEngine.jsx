import React from "react";
import { contextEngine as ce } from "../mock";
import ResponsiveFlow from "./ResponsiveFlow";
export default function ContextEngine() {
  return <section className="wrap context-section" aria-labelledby="context-section-title">
    <header className="context-section__header"><span className="eyebrow">{ce.eyebrow}</span><h2 className="display" id="context-section-title"><span>Myco reads your </span><span>whole system. </span><span>Not just the diff.</span></h2><p>{ce.body}</p></header>
    <div className="context-section__visual"><ResponsiveFlow /></div>
  </section>;
}
