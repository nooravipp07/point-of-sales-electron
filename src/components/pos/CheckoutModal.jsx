import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { formatNumber, mround } from '../../utils/formatNumber';

const CheckoutModal = ({ isOpen, cartItems, totals, onConfirm, onCancel, isLoading }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderMethod, setOrderMethod] = useState('online');
  const [serviceMethod, setServiceMethod] = useState('direct');
  const [notes, setNotes] = useState('');
  const [cashReceived, setCashReceived] = useState('');

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'cash' || !cashReceived) return 0;
    const received = parseFloat(cashReceived) || 0;
    return received - totals.total;
  }, [cashReceived, paymentMethod, totals.total]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!paymentMethod.trim()) {
      alert('Silakan pilih metode pembayaran');
      return;
    }
    if (!orderMethod.trim()) {
      alert('Silakan pilih metode pemesanan');
      return;
    }
    if (!serviceMethod.trim()) {
      alert('Silakan pilih metode pelayanan');
      return;
    }
    if (paymentMethod === 'cash' && !cashReceived) {
      alert('Silakan masukkan nominal uang');
      return;
    }
    if (paymentMethod === 'cash' && cashChange < 0) {
      alert('Uang yang diterima kurang dari total');
      return;
    }

    onConfirm({
      paymentMethod,
      orderMethod,
      serviceMethod,
      notes,
      cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
      cashChange: paymentMethod === 'cash' ? cashChange : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Konfirmasi Pesanan</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Items Table */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-gray-600 uppercase tracking-wider">Detail Pesanan</h3>
            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left font-bold text-gray-600">Produk</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-600">Harga</th>
                    <th className="px-6 py-4 text-center font-bold text-gray-600">Qty</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-600">Diskon</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cartItems.map((item) => {
                    const gross = mround(item.price * item.quantity);
                    const discount = item.discount;
                    const nett = gross - discount;

                    return (
                      <tr key={item.id} className="hover:bg-gray-100/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{formatNumber(item.price)}</td>
                        <td className="px-6 py-4 text-center text-gray-900 font-bold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600">-{formatNumber(discount)}</td>
                        <td className="px-6 py-4 text-right text-gray-900 font-bold">{formatNumber(nett)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold text-gray-900">{formatNumber(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Diskon</span>
              <span className="font-bold text-emerald-600">-{formatNumber(totals.totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-3 border-t border-emerald-200">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-900">{formatNumber(totals.total)}</span>
            </div>
          </div>

          {/* Order Method */}
          <div>
            <label className="font-bold text-sm mb-4 text-gray-600 uppercase tracking-wider block">
              Metode Pemesanan
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['online', 'offline'].map((method) => (
                <button
                  key={method}
                  onClick={() => setOrderMethod(method)}
                  disabled={isLoading}
                  className={`py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    orderMethod === method
                      ? 'bg-black text-white shadow-lg shadow-black/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {method === 'online' && 'Online'}
                  {method === 'offline' && 'Offline'}
                </button>
              ))}
            </div>
          </div>

          {/* Service Method */}
          <div>
            <label className="font-bold text-sm mb-4 text-gray-600 uppercase tracking-wider block">
              Metode Pelayanan
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['direct', 'processing'].map((method) => (
                <button
                  key={method}
                  onClick={() => setServiceMethod(method)}
                  disabled={isLoading}
                  className={`py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    serviceMethod === method
                      ? 'bg-black text-white shadow-lg shadow-black/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {method === 'direct' && 'Direct'}
                  {method === 'processing' && 'Processing Order'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-bold text-sm mb-4 text-gray-600 uppercase tracking-wider block">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['cash', 'debit', 'credit'].map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== 'cash') {
                      setCashReceived('');
                    }
                  }}
                  disabled={isLoading}
                  className={`py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    paymentMethod === method
                      ? 'bg-black text-white shadow-lg shadow-black/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {method === 'cash' && 'Tunai'}
                  {method === 'debit' && 'Debit'}
                  {method === 'credit' && 'Kredit'}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input Section (only show if payment method is cash) */}
          {paymentMethod === 'cash' && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm text-gray-600 mb-2">Nominal Masuk (Rp)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Masukkan nominal uang"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm text-gray-600 mb-2">Total Kembali (Rp)</label>
                  <div className={`w-full px-4 py-3 rounded-xl border-2 font-bold text-lg flex items-center justify-center ${
                    cashChange < 0 
                      ? 'bg-red-50 border-red-300 text-red-600' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-600'
                  }`}>
                    {formatNumber(Math.max(0, cashChange))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-bold text-sm text-gray-600 uppercase tracking-wider mb-2">Catatan (Opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan pesanan..."
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-black hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} /> Konfirmasi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
