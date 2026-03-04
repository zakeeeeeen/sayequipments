import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const bookingId = body?.bookingId as string | undefined
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const base = process.env.MAYAR_CHECKOUT_URL
    const appUrl = process.env.APP_URL
    if (!base || !appUrl) {
      return NextResponse.json({ error: "Missing MAYAR_CHECKOUT_URL or APP_URL" }, { status: 500 })
    }

    const dpAmount = Math.round(booking.totalPrice * 0.5)
    const returnUrl = `${appUrl}/payment/success?bookingId=${booking.id}`
    const cancelUrl = `${appUrl}/payment/cancel?bookingId=${booking.id}`

    const url = `${base}?amount=${dpAmount}&ref=${encodeURIComponent(booking.id)}&return_url=${encodeURIComponent(returnUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
