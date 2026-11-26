'use client'

import {useRef, useState, type FormEvent} from 'react'
import {betaRequestSchema, type BetaRequestData} from '@/lib/schema'
import './trial-request.css'

export function BetaRequest({feature}: {feature: BetaRequestData['feature']}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const result = betaRequestSchema.safeParse({
      ...Object.fromEntries(new FormData(event.currentTarget)), kind: 'beta', feature,
    })
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.message])))
      return
    }
    setErrors({})
    pending.current = true
    setSending(true)
    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(result.data),
      })
      const data = await response.json()
      if (response.ok && data.ok) setSent(true)
      else setErrors(data.errors ?? {form: data.message || 'We couldn’t send your request. Try again.'})
    } catch {
      setErrors({form: 'We couldn’t send your request. Try again.'})
    } finally {
      pending.current = false
      setSending(false)
    }
  }

  function feedback(field: string) {
    return errors[field] && <p id={`beta-error-${field}`} className="trial-dialog-field-error" role="alert">{errors[field]}</p>
  }

  function fieldProps(field: string) {
    return {
      id: `beta-${field}`, name: field, required: true, readOnly: sending,
      'aria-invalid': errors[field] ? true : undefined,
      'aria-describedby': errors[field] ? `beta-error-${field}` : undefined,
    }
  }

  return <>
    <button type="button" className="pilot trial-request-button" aria-haspopup="dialog" aria-controls="beta-request" onClick={() => {
      if (!dialog.current?.open) dialog.current?.showModal()
    }}>Request private beta access</button>
    <dialog ref={dialog} id="beta-request" className="trial-dialog" aria-labelledby="beta-title" aria-describedby="beta-intro" onClose={() => { if (sent) setSent(false) }}>
      <button type="button" className="trial-dialog-close" aria-label="Close beta form" onClick={() => dialog.current?.close()}>×</button>
      <p className="trial-dialog-badge">{feature}</p>
      <h2 id="beta-title">{sent ? 'Request received' : 'Request private beta access'}</h2>
      <p id="beta-intro" className="trial-dialog-intro" role={sent ? 'status' : undefined}>
        {sent ? 'Thanks for reaching out. We’ll follow up at your work email.' : 'Tell us what you’d like to try. Our team will reach out to discuss private beta access.'}
      </p>
      {!sent && <form onSubmit={submit} method="post" noValidate>
        <label htmlFor="beta-fullName">Full name<span className="trial-dialog-required" aria-hidden="true">*</span></label>
        <input {...fieldProps('fullName')} autoComplete="name" placeholder="Alex Jones" maxLength={120}/>
        {feedback('fullName')}
        <label htmlFor="beta-workEmail">Work email<span className="trial-dialog-required" aria-hidden="true">*</span></label>
        <input {...fieldProps('workEmail')} type="email" autoComplete="email" placeholder="alex@acme.com" maxLength={254}/>
        {feedback('workEmail')}
        <label htmlFor="beta-message">What would you like to try?<span className="trial-dialog-required" aria-hidden="true">*</span></label>
        <textarea {...fieldProps('message')} rows={3} maxLength={600}/>
        {feedback('message')}
        <div className="trial-dialog-trap" aria-hidden="true">
          <label htmlFor="beta-website">Website</label>
          <input id="beta-website" name="website" tabIndex={-1} autoComplete="off"/>
        </div>
        <button className="trial-dialog-submit" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Request private beta access'} <span aria-hidden="true">→</span></button>
        {errors.form && <p className="trial-dialog-error" role="alert">{errors.form}</p>}
      </form>}
    </dialog>
  </>
}
