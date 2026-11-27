import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {getWebsiteCustomerSession} from '@/lib/supabase/server'
import {allowRequest, readJsonLimited, RequestTooLarge} from '@/lib/request-security'
import {allowsGuestTestCheckout, orderProof, paymentGateway, signaturesMatch, signPaymentValue} from '@/lib/razorpay-checkout'

const schema = z.object({
  order_id: z.string().regex(/^order_[a-z0-9]+$/i).max(64),
  order_proof: z.string().regex(/^[a-f0-9]{64}$/i),
  razorpay_order_id: z.string().max(64),
  razorpay_payment_id: z.string().regex(/^pay_[a-z0-9]+$/i).max(64),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
})

export async function POST(request: NextRequest) {
  if (!allowRequest('verify-payment', 20)) return NextResponse.json({message: 'Too many requests. Try again shortly.'}, {status: 429})
  try {
    const owner = allowsGuestTestCheckout()
      ? 'preview-guest'
      : (await getWebsiteCustomerSession({readOnly: true}))?.user.id
    if (!owner) return NextResponse.json({message: 'Sign in to verify your payment.'}, {status: 401})
    const input = schema.safeParse(await readJsonLimited(request, 4096))
    if (!input.success) return NextResponse.json({message: 'Payment details are missing or invalid.'}, {status: 400})
    const data = input.data
    const {client, secret} = paymentGateway()
    const signature = signPaymentValue(secret, `${data.order_id}|${data.razorpay_payment_id}`)
    if (data.order_id !== data.razorpay_order_id ||
      !signaturesMatch(orderProof(secret, owner, data.order_id), data.order_proof) ||
      !signaturesMatch(signature, data.razorpay_signature)) {
      return NextResponse.json({message: 'Payment signature could not be verified.'}, {status: 400})
    }
    const payment = await client.payments.fetch(data.razorpay_payment_id)
    if (payment.order_id !== data.order_id || payment.status !== 'captured') {
      return NextResponse.json({message: 'Payment capture is not confirmed yet. Check Razorpay before paying again.'}, {status: 409})
    }
    return NextResponse.json({ok: true})
  } catch (error) {
    if (error instanceof RequestTooLarge) return NextResponse.json({message: 'Request is too large.'}, {status: 413})
    if (error instanceof SyntaxError) return NextResponse.json({message: 'Invalid payment details.'}, {status: 400})
    return NextResponse.json({message: 'We could not confirm your payment. Check Razorpay before paying again.'}, {status: 500})
  }
}
