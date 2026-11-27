import {createHmac, timingSafeEqual} from 'node:crypto'
import Razorpay from 'razorpay'

export class CheckoutConfigurationError extends Error {}

export function allowsGuestTestCheckout() {
  return process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'grege-dev' &&
    process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') === true
}

export function paymentGateway() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !secret) throw new CheckoutConfigurationError('Missing Razorpay credentials')
  const isTestKey = keyId.startsWith('rzp_test_')
  const isLiveKey = keyId.startsWith('rzp_live_')
  if (!isTestKey && !isLiveKey) throw new CheckoutConfigurationError('Invalid Razorpay key ID')
  if (isLiveKey && process.env.VERCEL_ENV !== 'production') {
    throw new CheckoutConfigurationError('Live Razorpay credentials require a Vercel Production deployment')
  }
  return {client: new Razorpay({key_id: keyId, key_secret: secret}), keyId, secret}
}

export function checkoutAmount(period: 'monthly' | 'annual') {
  const amount = Number(period === 'annual'
    ? process.env.RAZORPAY_ANNUAL_AMOUNT_PAISE
    : process.env.RAZORPAY_MONTHLY_AMOUNT_PAISE)
  if (!Number.isSafeInteger(amount) || amount < 100) throw new CheckoutConfigurationError(`Invalid Razorpay ${period} amount`)
  return amount
}

export function signPaymentValue(secret: string, value: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function signaturesMatch(expected: string, actual: string) {
  return /^[a-f0-9]{64}$/i.test(actual) &&
    timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))
}

export function orderProof(secret: string, owner: string, orderId: string) {
  return signPaymentValue(secret, `myco-order|${owner}|${orderId}`)
}
