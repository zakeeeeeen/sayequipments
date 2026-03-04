import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const raw = await req.text()
    const event = JSON.parse(raw || "{}")

    if (event?.type === "payment.paid") {
      const ref = event?.data?.metadata?.ref || event?.data?.ref
      if (typeof ref === "string" && ref.length > 0) {
        await prisma.$executeRaw`UPDATE booking SET status = 'CONFIRMED' WHERE id = ${ref}`
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
