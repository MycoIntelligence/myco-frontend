import "@/src/styles/atmospheric-smoke.css";

/** Original decorative atmospheric layers; all product copy stays above them. */
export function AtmosphericSmoke() {
  return <div className="myco-atmosphere" aria-hidden="true">
    <div className="myco-atmosphere__haze" />
    <div className="myco-atmosphere__wisp myco-atmosphere__wisp--one" />
    <div className="myco-atmosphere__wisp myco-atmosphere__wisp--two" />
  </div>;
}
