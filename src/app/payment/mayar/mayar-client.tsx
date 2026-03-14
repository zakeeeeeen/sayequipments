"use client"

import Link from "next/link"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"

interface BookingItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price1Day: number
  }
}

interface Booking {
  id: string
  customerName: string
  customerPhone: string
  startDate: Date
  endDate: Date
  totalPrice: number
  status: string
  paymentMethod: string | null
  bookingitem: BookingItem[]
}

interface MayarPaymentClientProps {
  booking: Booking
  paymentAmount: number
  bookingId: string
  initialQrUrl?: string
  initialAmount?: number
}

export default function MayarPaymentClient({
  booking,
  paymentAmount,
  bookingId,
  initialQrUrl,
  initialAmount,
}: MayarPaymentClientProps) {
  const [qrUrl, setQrUrl] = useState<string>(initialQrUrl || "")
  const [effectiveAmount, setEffectiveAmount] = useState<number>(initialAmount || paymentAmount)
  const [loading, setLoading] = useState(!initialQrUrl)

  const createFreshQr = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payments/mayar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentType: booking.paymentMethod === "DP_50" ? "DP_50" : "FULL",
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || "Gagal membuat QR pembayaran")
      }

      if (typeof data?.qrUrl === "string" && data.qrUrl.length > 0) {
        setQrUrl(data.qrUrl)
      }

      if (Number.isFinite(data?.amount)) {
        setEffectiveAmount(Number(data.amount))
      }
    } catch (error) {
      console.error("Error fetching QR:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom pt-24 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-earth-900 mb-2">Selesaikan Pembayaran</h1>
          <p className="text-earth-600">Scan QR Code di bawah dengan aplikasi pembayaran Anda</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-earth-100 p-8 mb-8">
          {/* QR Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-earth-100">
            {loading ? (
              <div className="w-64 h-64 bg-earth-100 rounded-xl flex items-center justify-center">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-earth-300 border-t-primary-600 rounded-full"></div>
                </div>
              </div>
            ) : qrUrl ? (
              <div className="relative w-64 h-64 bg-gradient-to-br from-primary-50 to-earth-50 rounded-xl p-4 flex items-center justify-center shadow-md">
                <img
                  src={qrUrl}
                  alt="Mayar QR Code"
                  loading="eager"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-earth-100 rounded-xl flex items-center justify-center text-earth-600">
                QR tidak tersedia
              </div>
            )}
            <p className="text-sm text-earth-600 text-center mt-4">
              Arahkan kamera ponsel Anda ke QR Code untuk melakukan pembayaran
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-6">
            {/* Booking Info */}
            <div className="bg-earth-50 rounded-lg p-4">
              <p className="text-sm text-earth-600 mb-1">ID Pesanan</p>
              <p className="font-mono text-lg font-bold text-earth-900 break-all">{booking.id}</p>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-earth-600 mb-1">Nama Pelanggan</p>
                <p className="font-medium text-earth-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-earth-600 mb-1">No. WhatsApp</p>
                <p className="font-medium text-earth-900">{booking.customerPhone}</p>
              </div>
            </div>

            {/* Rental Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-earth-600 mb-1">Tanggal Mulai</p>
                <p className="font-medium text-earth-900">
                  {new Date(booking.startDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-earth-600 mb-1">Tanggal Selesai</p>
                <p className="font-medium text-earth-900">
                  {new Date(booking.endDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Items */}
            {booking.bookingitem.length > 0 && (
              <div>
                <p className="text-sm text-earth-600 mb-3 font-semibold">Barang yang Disewa</p>
                <div className="space-y-2">
                  {booking.bookingitem.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-earth-900">{item.product.name}</p>
                        <p className="text-earth-600">{item.quantity} unit</p>
                      </div>
                      <p className="font-medium text-earth-900">
                        {formatCurrency(item.quantity * item.product.price1Day)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Summary */}
            <div className="bg-gradient-to-r from-primary-50 to-earth-50 rounded-lg p-6 border border-primary-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-earth-700">Total Harga</span>
                <span className="text-earth-900 font-medium">{formatCurrency(booking.totalPrice)}</span>
              </div>

              {booking.paymentMethod === "DP_50" && (
                <>
                  <div className="flex justify-between items-center text-sm text-earth-600 mb-3 pb-3 border-b border-primary-200">
                    <span>DP 50%</span>
                    <span>{formatCurrency(paymentAmount)}</span>
                  </div>
                  <p className="text-xs text-earth-600">
                    Sisa pembayaran {formatCurrency(booking.totalPrice - effectiveAmount)} akan dibayar saat pengambilan barang.
                  </p>
                </>
              )}

              <div className="flex justify-between items-end pt-3 border-t border-primary-300 mt-3">
                <span className="text-lg font-bold text-earth-900">Yang Harus Dibayar</span>
                <span className="text-2xl font-bold text-primary-700">{formatCurrency(effectiveAmount)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ℹ️ Pembayaran melalui <strong>Mayar Indonesia</strong>. Aman dan terpercaya.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={createFreshQr}
                className="bg-primary-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-primary-700 transition-colors text-center"
                disabled={loading}
              >
                {loading ? "Memuat QR..." : "Buat Ulang QR"}
              </button>
              <a
                href={`/payment/mayar?bookingId=${bookingId}`}
                className="bg-emerald-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-center"
              >
                Cek Status
              </a>
              <Link
                href="/cart"
                className="bg-white text-earth-900 border-2 border-earth-200 py-3 px-4 rounded-lg font-bold hover:bg-earth-50 transition-colors text-center"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-earth-50 rounded-lg p-6 border border-earth-200">
          <h3 className="font-bold text-earth-900 mb-3">Butuh Bantuan?</h3>
          <ul className="text-sm text-earth-700 space-y-2">
            <li>✓ Pembayaran via Mayar aman dan terpercaya</li>
            <li>✓ Jangan refresh halaman saat transfer sedang diproses</li>
            <li>✓ Jika pembayaran gagal, coba lagi atau hubungi admin</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
