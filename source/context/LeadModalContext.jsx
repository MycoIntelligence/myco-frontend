import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { lead } from "../mock";
import { X, ArrowRight, Check } from "lucide-react";

const BACKEND_URL = "";
const API = `${BACKEND_URL}/api`;

const LeadModalContext = createContext({ open: () => {}, close: () => {} });
export const useLeadModal = () => useContext(LeadModalContext);

export function LeadModalProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = () => setOpen(true);
  const close = () => setOpen(false);
  return (
    <LeadModalContext.Provider value={{ open, close }}>
      {children}
      {isOpen && <LeadModal onClose={close} />}
    </LeadModalContext.Provider>
  );
}

function LeadModal({ onClose }) {
  const [values, setValues] = useState({ name: "", email: "", repo: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await axios.post(`${API}/leads`, values);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">ONE MONTH FREE</div>
            <h3 className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{lead.title}</h3>
          </div>
          <button onClick={onClose} className="theme-toggle" aria-label="Close" style={{ width: 34, height: 34 }}>
            <X size={16} />
          </button>
        </div>

        {status === "success" ? (
          <div style={{ padding: "28px 0 6px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 40, background: "rgba(14,148,110,0.14)", color: "var(--accent-dark)" }}>
              <Check size={22} />
            </div>
            <p style={{ marginTop: 18, fontSize: 16, color: "var(--ink)" }}>{lead.success}</p>
            <button onClick={onClose} className="btn btn-outline" style={{ marginTop: 20 }}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 18 }}>
            <p style={{ color: "var(--muted)", fontSize: 14.5, marginBottom: 20 }}>{lead.body}</p>
            {lead.fields.map((f) => (
              <div key={f.name} style={{ marginBottom: 16 }}>
                <label className="field-label" htmlFor={f.name}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea id={f.name} name={f.name} className="field-input" rows={3} placeholder={f.placeholder} value={values[f.name]} onChange={onChange} required={f.required} />
                ) : (
                  <input id={f.name} name={f.name} type={f.type} className="field-input" placeholder={f.placeholder} value={values[f.name]} onChange={onChange} required={f.required} />
                )}
              </div>
            ))}
            {status === "error" && (
              <div className="mono" style={{ fontSize: 12.5, color: "#C0553C", marginBottom: 12 }}>{error}</div>
            )}
            <button type="submit" className="btn btn-primary" disabled={status === "loading"} style={{ width: "100%", justifyContent: "center", opacity: status === "loading" ? 0.7 : 1 }}>
              {status === "loading" ? "Sending\u2026" : "Request a pilot"} <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
