import {afterEach, describe, expect, it, vi} from 'vitest'
import {checkoutAmount, orderProof, signaturesMatch, signPaymentValue} from '../lib/razorpay-checkout'

afterEach(() => vi.unstubAllEnvs())

describe('Razorpay checkout', () => {
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
