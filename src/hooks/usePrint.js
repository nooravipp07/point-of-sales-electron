export function usePrint() {
    const printReceipt = async (receiptData) => {
        // Fallback if not in Electron
        if (!window.electronAPI?.printReceipt) {
            console.warn('Electron print API not available');
            alert('Printer only available in the desktop app.');
            return false;
        }

        try {
            const result = await window.electronAPI.printReceipt(receiptData);
            return result?.success ?? false;
        } catch (err) {
            console.error('Print failed:', err);
            alert('Gagal print: ' + err);
            return false;
        }
    };

    const getUsbPrinters = async () => {
        if (!window.electronAPI?.getUsbPrinters) return [];
        try {
            const result = await window.electronAPI.getUsbPrinters();
            return result?.devices ?? [];
        } catch {
            return [];
        }
    };

    const testPrint = async (printerName) => {
        if (!window.electronAPI?.testPrint) {
            alert('Test print only available in desktop app.');
            return false;
        }
        try {
            const result = await window.electronAPI.testPrint(printerName);
            return result?.success ?? false;
        } catch (err) {
            console.error('Test print failed:', err);
            throw err;
        }
    };

    return { printReceipt, getUsbPrinters, testPrint };
}