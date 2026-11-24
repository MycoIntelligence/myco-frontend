"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, MessageCircle, Sparkles, X } from "lucide-react";
import "@/src/styles/myco-assistant.css";

type Source = { title?: string; url?: string; href?: string };
type Message = { id: number; role: "user" | "assistant"; text: string; sources?: Source[]; error?: boolean };
const suggestions = ["What does Myco do?", "How does pricing work?", "Which integrations are available?"];

/** The launcher is quiet by default; the conversation stays in this browser session. */
export function MycoAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const counter = useRef(0);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { if (open && messages.length) end.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [messages, loading, open]);
  useEffect(() => () => request.current?.abort(), []);
  const close = () => { setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); };
  const ask = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    if (text.length > 1000) { setError("Please keep your question under 1,000 characters."); return; }
    setError(""); setQuestion(""); setLoading(true);
    setMessages(current => [...current, { id: ++counter.current, role: "user", text }]);
    const controller = new AbortController(); request.current = controller;
    try {
      const res = await fetch("/api/chat/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }), signal: controller.signal });
      const data: { answer?: unknown; sources?: unknown; error?: unknown } = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.answer !== "string" || !data.answer.trim()) throw new Error("unavailable");
      setMessages(current => [...current, { id: ++counter.current, role: "assistant", text: data.answer as string, sources: Array.isArray(data.sources) ? data.sources as Source[] : [] }]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages(current => [...current, { id: ++counter.current, role: "assistant", text: "I couldn’t get an answer right now. Please try again, or contact the Myco team.", error: true }]);
    } finally { if (!controller.signal.aborted) { setLoading(false); request.current = null; } }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question); };
  return <div className="myco-assistant-root" onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}>
    {open && <section className="myco-assistant-panel" aria-label="Myco assistant" aria-describedby="myco-assistant-description">
      <header className="myco-assistant-header"><div className="myco-assistant-brand"><span className="myco-assistant-brand-icon"><Sparkles size={18} aria-hidden="true" /></span><div><strong>Myco assistant</strong><span>Product & pricing questions</span></div></div><button type="button" className="myco-assistant-close" aria-label="Close assistant" onClick={close}><X size={19} aria-hidden="true" /></button></header>
      <div className="myco-assistant-messages" role="log" aria-live="polite" aria-relevant="additions text">
        <div className="myco-assistant-welcome"><span className="myco-assistant-eyebrow">HERE TO HELP</span><h2>What would you like to know?</h2><p id="myco-assistant-description">Ask about Myco’s workflow, pricing, or what’s available today.</p></div>
        {messages.length === 0 && <div className="myco-assistant-suggestions" aria-label="Suggested questions">{suggestions.map(item => <button type="button" key={item} onClick={() => void ask(item)} disabled={loading}>{item}<span aria-hidden="true">→</span></button>)}</div>}
        {messages.map(message => <div key={message.id} className={`myco-assistant-message is-${message.role}${message.error ? " is-error" : ""}`}><span className="myco-assistant-message-label">{message.role === "user" ? "YOU" : "MYCO"}</span><div className="myco-assistant-bubble">{message.text}</div>{message.sources && message.sources.length > 0 && <div className="myco-assistant-sources">{message.sources.map((source, i) => { const href = source.url || source.href; return href?.startsWith("/") && !href.startsWith("//") ? <a key={i} href={href}>{source.title || "Learn more"} →</a> : null; })}</div>}</div>)}
        {loading && <div className="myco-assistant-thinking" role="status"><span className="myco-assistant-spinner" /> Looking for an answer<span className="sr-only">, please wait</span></div>}
        <div ref={end} />
      </div>
      <form className="myco-assistant-form" onSubmit={submit}><label className="sr-only" htmlFor="myco-assistant-input">Ask Myco a question</label><div className="myco-assistant-compose"><textarea id="myco-assistant-input" ref={input} rows={1} maxLength={1000} value={question} placeholder="Ask a question…" onChange={e => { setQuestion(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void ask(question); } }} /><button type="submit" aria-label="Send question" disabled={loading || !question.trim()}><ArrowUp size={19} aria-hidden="true" /></button></div>{error && <p className="myco-assistant-error" role="alert">{error}</p>}<p className="myco-assistant-disclaimer">Answers are based on available Myco information.</p></form>
    </section>}
    <button ref={launcher} type="button" className="myco-assistant-launcher" hidden={open} aria-label="Open Myco assistant" aria-expanded={open} onClick={() => setOpen(true)}><MessageCircle size={21} aria-hidden="true" /><span>Ask Myco</span></button>
  </div>;
}
