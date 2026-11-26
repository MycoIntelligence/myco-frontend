'use client'

import Script from 'next/script'
import Link from 'next/link'
import {useRef, useState, type ReactNode} from 'react'

type CheckoutResult = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type CheckoutOptions = {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  handler: (result: CheckoutResult) => void
  modal: {ondismiss: () => void}
}

export function RazorpayButton({annual, children}: {annual: boolean; children: ReactNode}) {
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)

  function finish(message: string) {
    pending.current = false
    setBusy(false)
    setNotice(message)
  }

  async function checkout() {
    if (pending.current) return
    const Checkout = (window as Window & {
      Razorpay?: new (options: CheckoutOptions) => {
        open: () => void
        on: (event: 'payment.failed', handler: () => void) => void
      }
    }).Razorpay
    if (!Checkout) {
      setNotice('Checkout is still loading or was blocked. Refresh and try again.')
      return
    }
    pending.current = true
    setBusy(true)
    setNotice('')
    setNeedsLogin(false)
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({period: annual ? 'annual' : 'monthly'}),
      })
      const order = await response.json()
      if (!response.ok) {
        setNeedsLogin(response.status === 401)
        finish(order.message || 'Could not start checkout.')
        return
      }

      let verifying = false
      let paymentFailed = false
      const modal = new Checkout({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Myco',
        description: annual ? 'Pro · 1 developer · Annual' : 'Pro · 1 developer · Monthly',
        modal: {ondismiss: () => {
          if (!verifying) finish(paymentFailed ? 'Payment failed. You can try again.' : 'Checkout cancelled.')
        }},
        handler: async (result) => {
          verifying = true
          setNotice('Verifying your payment…')
          try {
            const verification = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({...result, order_id: order.order_id, order_proof: order.order_proof}),
            })
            const status = await verification.json()
            finish(verification.ok && status.ok ? 'Payment verified.' : (status.message || 'Payment could not be verified.'))
          } catch {
            finish('We could not confirm your payment. Check Razorpay before paying again.')
          }
        },
      })
      modal.on('payment.failed', () => {
        paymentFailed = true
        setNotice('Payment failed. Try again in checkout or close it.')
      })
      modal.open()
    } catch {
      finish('Checkout is unavailable. Please try again.')
    }
  }

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload"
      onError={() => setNotice('Razorpay checkout could not load.')} />
    <button className="plan-button plan-primary" type="button" disabled={busy} onClick={checkout}>
      {busy ? 'Checkout in progress…' : children}
    </button>
    {notice && <p className="plan-summary" role="status">{notice} {needsLogin && <Link href="/login/">Sign in</Link>}</p>}
  </>
}
