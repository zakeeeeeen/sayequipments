import { NextResponse } from "next/server"
import { createMayarQrCode } from "@/lib/mayar"
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

    const dpAmount = Math.round(booking.totalPrice * 0.5)
    const qrCode = await createMayarQrCode({ amount: dpAmount })

    return NextResponse.json({
      amount: qrCode.amount,
      bookingId: booking.id,
      url: qrCode.url,
    })
  } catch (error) {
    console.error("Failed to create Mayar QR code:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    )
  }
}
