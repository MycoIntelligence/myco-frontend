import {randomUUID} from 'node:crypto'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {getWebsiteCustomerSession} from '@/lib/supabase/server'
import {allowRequest, readJsonLimited, RequestTooLarge} from '@/lib/request-security'
import {checkoutAmount, orderProof, paymentGateway} from '@/lib/razorpay-checkout'

const schema = z.object({period: z.enum(['monthly', 'annual'])}).strict()

export async function POST(request: NextRequest) {
  if (!allowRequest('create-order', 10)) return NextResponse.json({message: 'Too many requests. Try again shortly.'}, {status: 429})
  try {
    const session = await getWebsiteCustomerSession({readOnly: true})
    if (!session) return NextResponse.json({message: 'Sign in before starting checkout.'}, {status: 401})
    const input = schema.safeParse(await readJsonLimited(request, 2048))
    if (!input.success) return NextResponse.json({message: 'Choose a valid billing period.'}, {status: 400})
    const {client, keyId, secret} = paymentGateway()
    const amount = checkoutAmount(input.data.period)
    const order = await client.orders.create({amount, currency: 'INR', receipt: randomUUID()})
    return NextResponse.json({
      order_id: order.id, amount, currency: order.currency, key_id: keyId,
      order_proof: orderProof(secret, session.user.id, order.id),
    })
  } catch (error) {
    if (error instanceof RequestTooLarge) return NextResponse.json({message: 'Request is too large.'}, {status: 413})
    if (error instanceof SyntaxError) return NextResponse.json({message: 'Invalid checkout request.'}, {status: 400})
    return NextResponse.json({message: 'Checkout is unavailable. Please try again.'}, {status: 500})
  }
}
