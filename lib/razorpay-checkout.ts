import {createHmac, timingSafeEqual} from 'node:crypto'
import Razorpay from 'razorpay'

export function paymentGateway() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !secret) throw new Error('Razorpay is not configured')
  return {client: new Razorpay({key_id: keyId, key_secret: secret}), keyId, secret}
}

export function checkoutAmount(period: 'monthly' | 'annual') {
  const amount = Number(period === 'annual'
    ? process.env.RAZORPAY_ANNUAL_AMOUNT_PAISE
    : process.env.RAZORPAY_MONTHLY_AMOUNT_PAISE)
  if (!Number.isSafeInteger(amount) || amount < 100) throw new Error('Invalid checkout pricing')
  return amount
}

export function signPaymentValue(secret: string, value: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function signaturesMatch(expected: string, actual: string) {
  return /^[a-f0-9]{64}$/i.test(actual) &&
    timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))
}

export function orderProof(secret: string, userId: string, orderId: string) {
  return signPaymentValue(secret, `myco-order|${userId}|${orderId}`)
}
