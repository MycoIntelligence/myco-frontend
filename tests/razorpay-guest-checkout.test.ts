import {NextRequest} from 'next/server'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {POST as createOrder} from '@/app/api/create-order/route'
import {POST as verifyPayment} from '@/app/api/verify-payment/route'
import {signPaymentValue} from '@/lib/razorpay-checkout'
import {getWebsiteCustomerSession} from '@/lib/supabase/server'

const {create, fetchPayment} = vi.hoisted(() => ({create: vi.fn(), fetchPayment: vi.fn()}))

vi.mock('razorpay', () => ({
  default: class {
    orders = {create}
    payments = {fetch: fetchPayment}
  },
}))
vi.mock('@/lib/supabase/server', () => ({getWebsiteCustomerSession: vi.fn(async () => null)}))

function post(path: string, body: object) {
  return new NextRequest(`https://example.test/api/${path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })
}

describe('Razorpay preview guest checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'grege-dev')
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_example')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'example-secret')
    vi.stubEnv('RAZORPAY_MONTHLY_AMOUNT_PAISE', '100')
    create.mockResolvedValue({id: 'order_123', currency: 'INR'})
    fetchPayment.mockResolvedValue({order_id: 'order_123', status: 'captured'})
  })

  afterEach(() => vi.unstubAllEnvs())

  it('creates and verifies a test order without contacting Supabase', async () => {
    const response = await createOrder(post('create-order', {period: 'monthly'}))
    expect(response.status).toBe(200)
    expect(create).toHaveBeenCalledWith({amount: 100, currency: 'INR', receipt: expect.any(String)})
    const order = await response.json()
    const payload = {
      order_id: order.order_id,
      order_proof: order.order_proof,
      razorpay_order_id: order.order_id,
      razorpay_payment_id: 'pay_123',
      razorpay_signature: signPaymentValue('example-secret', 'order_123|pay_123'),
    }
    expect((await verifyPayment(post('verify-payment', {...payload, order_proof: '0'.repeat(64)}))).status).toBe(400)
    expect(fetchPayment).not.toHaveBeenCalled()
    const verified = await verifyPayment(post('verify-payment', payload))
    expect(verified.status).toBe(200)
    expect(await verified.json()).toEqual({ok: true})
    expect(getWebsiteCustomerSession).not.toHaveBeenCalled()
  })

  it.each([
    ['production', 'grege-dev', 'rzp_test_example'],
    ['preview', 'main', 'rzp_test_example'],
    ['preview', 'grege-dev', 'rzp_live_example'],
    [undefined, 'grege-dev', 'rzp_test_example'],
  ])('requires sign-in for %s / %s / %s', async (environment, branch, key) => {
    vi.stubEnv('VERCEL_ENV', environment)
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', branch)
    vi.stubEnv('RAZORPAY_KEY_ID', key)
    expect((await createOrder(post('create-order', {period: 'monthly'}))).status).toBe(401)
    expect((await verifyPayment(post('verify-payment', {}))).status).toBe(401)
    expect(create).not.toHaveBeenCalled()
    expect(fetchPayment).not.toHaveBeenCalled()
  })
})
