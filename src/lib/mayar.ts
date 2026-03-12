interface CreateMayarQrCodeParams {
  amount: number
}

interface MayarQrCodeApiResponse {
  statusCode?: number
  messages?: string
  data?: {
    url?: string
    amount?: number
  }
}

export async function createMayarQrCode({ amount }: CreateMayarQrCodeParams) {
  const apiKey = process.env.MAYAR_API_KEY

  if (!apiKey) {
    throw new Error("Missing MAYAR_API_KEY")
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payment amount")
  }

  const isSandbox = apiKey.includes("club") || process.env.MAYAR_ENV === "sandbox";
  const baseUrl = isSandbox ? "https://api.mayar.club" : "https://api.mayar.id";
  const response = await fetch(`${baseUrl}/hl/v1/qrcode/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => null)) as MayarQrCodeApiResponse | null

  if (!response.ok) {
    throw new Error(payload?.messages || "Failed to create Mayar QR code")
  }

  const qrUrl = payload?.data?.url
  const qrAmount = payload?.data?.amount

  if (!qrUrl || !qrAmount) {
    throw new Error("Invalid response from Mayar QR API")
  }

  return {
    amount: qrAmount,
    url: qrUrl,
  }
}