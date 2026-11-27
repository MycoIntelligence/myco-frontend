import {afterEach, describe, expect, it, vi} from 'vitest'
import {checkoutAmount, orderProof, paymentGateway, signaturesMatch, signPaymentValue} from '../lib/razorpay-checkout'

afterEach(() => vi.unstubAllEnvs())

describe('Razorpay checkout', () => {
  it.each(['preview', 'development', undefined])('rejects live keys when VERCEL_ENV is %s', (environment) => {
    vi.stubEnv('VERCEL_ENV', environment)
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_live_example')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'example-secret')
    expect(() => paymentGateway()).toThrow('Live Razorpay credentials require a Vercel Production deployment')
  })

  it.each([
    ['preview', 'rzp_test_example'],
    ['production', 'rzp_live_example'],
    ['production', 'rzp_test_example'],
  ])('accepts the configured key in %s', (environment, keyId) => {
    vi.stubEnv('VERCEL_ENV', environment)
    vi.stubEnv('RAZORPAY_KEY_ID', keyId)
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'example-secret')
    expect(paymentGateway().keyId).toBe(keyId)
  })

  it('rejects an unrecognized key ID', () => {
    vi.stubEnv('RAZORPAY_KEY_ID', 'example')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'example-secret')
    expect(() => paymentGateway()).toThrow('Invalid Razorpay key ID')
  })

  it('rejects missing or sub-minimum server pricing', () => {
    vi.stubEnv('RAZORPAY_MONTHLY_AMOUNT_PAISE', '99')
    expect(() => checkoutAmount('monthly')).toThrow()
    vi.stubEnv('RAZORPAY_MONTHLY_AMOUNT_PAISE', '100')
    expect(checkoutAmount('monthly')).toBe(100)
  })

  it('rejects changed payment IDs and malformed signatures', () => {
    const signature = signPaymentValue('test-secret', 'order_123|pay_123')
    expect(signaturesMatch(signature, signature)).toBe(true)
    expect(signaturesMatch(signature, signPaymentValue('test-secret', 'order_123|pay_456'))).toBe(false)
    expect(signaturesMatch(signature, 'invalid')).toBe(false)
  })

  it('binds the order to the signed-in customer', () => {
    const proof = orderProof('test-secret', 'customer-1', 'order_123')
    expect(signaturesMatch(proof, orderProof('test-secret', 'customer-2', 'order_123'))).toBe(false)
    expect(signaturesMatch(proof, orderProof('test-secret', 'customer-1', 'order_456'))).toBe(false)
  })
})
