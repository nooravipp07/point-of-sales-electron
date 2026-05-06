import { useState, useEffect } from 'react';
import { Printer, RefreshCw, CheckCircle2, XCircle, Wifi, WifiOff, TestTube } from 'lucide-react';
import { usePrint } from '../hooks/usePrint';

export default function PrinterSettings() {
    const { getUsbPrinters, testPrint } = usePrint();

    const [printers, setPrinters]           = useState([]);
    const [selectedPrinter, setSelected]    = useState(() => localStorage.getItem('selectedPrinter') || '');
    const [scanning, setScanning]           = useState(false);
    const [testing, setTesting]             = useState(false);
    const [testStatus, setTestStatus]       = useState(null); // 'success' | 'error' | null
    const [testMessage, setTestMessage]     = useState('');
    const [scanError, setScanError]         = useState('');
    const [showDebug, setShowDebug]         = useState(false);

    // Scan on mount
    useEffect(() => {
        handleScan();
    }, []);

    const handleScan = async () => {
        setScanning(true);
        setScanError('');
        setTestStatus(null);
        try {
            const found = await getUsbPrinters();
            setPrinters(found);
            if (found.length === 0) {
                setScanError('No USB printer found. Check cable and make sure WinUSB driver is installed via Zadig.');
            }
        } catch (err) {
            const errorMsg = err?.toString ? err.toString() : String(err);
            setScanError(`Failed to scan printers: ${errorMsg}`);
            console.error('Scan error:', err);
        } finally {
            setScanning(false);
        }
    };

    const handleSelect = (printer) => {
        const key = printer.name || `${printer.vendorId}:${printer.productId}`;
        setSelected(key);
        localStorage.setItem('selectedPrinter', key);
        setTestStatus(null);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestStatus(null);
        setTestMessage('');
        try {
            const result = await testPrint(selectedPrinter);
            
            if (result?.cancelled) {
                console.log('Test print cancelled by user');
                setTestStatus(null);
                setTestMessage('');
            } else if (result?.success) {
                setTestStatus('success');
                setTestMessage('Test print sent! Check your printer.');
            } else {
                setTestStatus('error');
                setTestMessage('Test print failed. Try again.');
            }
        } catch (err) {
            setTestStatus('error');
            const errorMsg = err?.toString ? err.toString() : String(err);
            setTestMessage(errorMsg || 'Test print failed.');
            console.error('Test print error:', err);
        } finally {
            setTesting(false);
        }
    };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Thermal Printer Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
              <Printer size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Thermal Printer</h2>
              <p className="text-xs text-gray-400">USB connected thermal printer</p>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>

        {/* Printer List */}
        <div className="px-8 py-6 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Available Printers ({printers.length})
          </p>

          {/* Error state */}
          {scanError && printers.length === 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <WifiOff size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">No printer detected</p>
                <p className="text-xs text-red-500 mt-1">{scanError}</p>
              </div>
            </div>
          )}

          {/* Printer items */}
          {printers.map((printer, index) => {
            const key       = printer.name || `${printer.vendorId}:${printer.productId}`;
            const isActive  = selectedPrinter === key;

            return (
              <button
                key={key}
                onClick={() => handleSelect(printer)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-white border border-gray-200'}`}>
                    <Printer size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {printer.displayName || printer.name || `Printer #${index + 1}`}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                      {printer.status || 'Ready'} • {printer.manufacturer || 'Windows Printer'}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-3 py-1 rounded-lg">
                    <CheckCircle2 size={13} />
                    Active
                  </div>
                )}
              </button>
            );
          })}

          {/* Empty + no error */}
          {printers.length === 0 && !scanError && !scanning && (
            <div className="flex flex-col items-center py-8 text-gray-300">
              <Printer size={32} strokeWidth={1} />
              <p className="text-sm mt-3">No printers found</p>
            </div>
          )}
        </div>

        {/* Test Print */}
        {selectedPrinter && (
          <div className="px-8 pb-6">
            <div className="border-t border-gray-50 pt-6 space-y-3">
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <TestTube size={15} />
                {testing ? 'Printing test...' : 'Test Print'}
              </button>

              {/* Test result */}
              {testStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-700">{testMessage}</p>
                </div>
              )}
              {testStatus === 'error' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{testMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Card */}
      <div className="bg-gray-50 rounded-3xl border border-gray-100 px-8 py-6 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Printer not showing up?</p>
        <ol className="space-y-2">
          {[
            'Make sure the printer is connected to your computer',
            'Ensure the printer is powered ON',
            'Check Windows Settings → Devices → Printers & Scanners',
            'Add the printer if not listed (click "Add a device")',
            'Click Scan button to refresh the printer list',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-3xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full flex items-center justify-between px-8 py-4 hover:bg-gray-200 transition-colors"
        >
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Debug Info</p>
          <span className={`text-gray-500 transition-transform ${showDebug ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {showDebug && (
          <div className="px-8 py-4 bg-white border-t border-gray-200 space-y-2">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Electron API Available:</span> {window.electronAPI ? 'Yes' : 'No'}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Printers Detected:</span> {printers.length}
            </p>
            {printers.length > 0 && (
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 font-mono max-h-40 overflow-y-auto">
                {printers.map((p, i) => (
                  <div key={i} className="text-gray-600">
                    [{i}] {p.manufacturer || 'Unknown'} {p.product || 'Unknown'} (VID: {p.vendorId}, PID: {p.productId})
                  </div>
                ))}
              </div>
            )}
            {scanError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <span className="font-semibold">Last Scan Error:</span> {scanError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}