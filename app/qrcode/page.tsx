'use client'

import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { generateAddress } from '@/utils/address'
import { generateName, generatePasswordByRole } from '@/utils/randomString'
import { useCalibrateLabel, useGetPrinters, usePrintQR } from '@/hooks/usePrinter'

// Pastikan file CSS di atas sudah diimport (jika menggunakan Next.js App Router, biasanya otomatis di layout/global)
// import './QRPrintPage.css' 

export default function QRPrintPage() {
    const printMutation = usePrintQR()
    const lCalibrateMutation = useCalibrateLabel()
    const { data } = useGetPrinters()

    const [printers, setPrinters] = useState<string[]>([])
    const [selectedPrinter, setSelectedPrinter] = useState<string>('')
    
    // --- STATE UTAMA ---
    const [indexStr, setIndexStr] = useState('1')
    const [role, setRole] = useState<'USER' | 'MAINTENANCE' | 'PRODUCTION' | 'SUPERUSER'>('USER')
    const [qr1, setQr1] = useState('')
    const [qr2, setQr2] = useState('')

    // --- STATE BATCH DOWNLOAD ---
    const [batchStart, setBatchStart] = useState('21')
    const [batchEnd, setBatchEnd] = useState('40')
    const [batchRole, setBatchRole] = useState<'USER' | 'MAINTENANCE' | 'PRODUCTION' | 'SUPERUSER'>('USER')
    const [batchFileType, setBatchFileType] = useState<'png' | 'jpeg'>('png')

    // --- STATE MESIN OTOMATIS ---
    const [isAutoRunning, setIsAutoRunning] = useState(false)
    const [autoIndex, setAutoIndex] = useState(21)
    const [autoEndIndex, setAutoEndIndex] = useState(40)

    // State Validasi
    const [hasChanges, setHasChanges] = useState<boolean>(false)
    const [lastGeneratedIndex, setLastGeneratedIndex] = useState<string>('1')
    const [lastGeneratedRole, setLastGeneratedRole] = useState<'USER' | 'MAINTENANCE' | 'PRODUCTION' | 'SUPERUSER'>('USER')

    const qrRef = useRef<HTMLDivElement>(null)
    const qrRef2 = useRef<HTMLDivElement>(null)

    // Dummy calls 
    generatePasswordByRole("USER")

    // Load Printers
    useEffect(() => {
        if (data && data.status && data.data && data.data.length > 0) {
            const printerList = data.data;
            setPrinters(printerList)
            if (!selectedPrinter) setSelectedPrinter(printerList[0])
        }
    }, [data, selectedPrinter]);

    // Deteksi Perubahan Manual
    useEffect(() => {
        if (isAutoRunning) return;
        const indexChanged = indexStr !== lastGeneratedIndex
        const roleChanged = role !== lastGeneratedRole
        setHasChanges(indexChanged || roleChanged)
    }, [indexStr, role, lastGeneratedIndex, lastGeneratedRole, isAutoRunning])


    // =================================================================
    // LOGIKA LOOP OTOMATIS (MESIN DOWNLOAD)
    // =================================================================
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const runAutoSequence = async () => {
            if (!isAutoRunning) return;

            // Cek jika sudah selesai
            if (autoIndex > autoEndIndex) {
                setIsAutoRunning(false);
                setHasChanges(false);
                setIndexStr(lastGeneratedIndex);
                setRole(lastGeneratedRole);
                alert(` Batch Download Selesai! (${autoIndex - 1} files processed)`);
                return;
            }

            // 1. DATA PROCESSING
            const currentIndexStr = String(autoIndex);
            
            // Update visual 
            setIndexStr(currentIndexStr);
            setRole(batchRole); 

            // GENERATE CONTENT 
            const index = autoIndex;
            const index2 = index + 10000;
            
            const btName = generateName('BT', index);
            const rmName = generateName('RM', index2);
            const address = generateAddress(index);
            const address2 = generateAddress(index2);
            const password = generatePasswordByRole(batchRole);
            
            const contentQR1 = `${btName}|${address}|${password}`;
            const contentQR2 = `${rmName}|${address2}|${password}`;
            
            setQr1(contentQR1);
            setQr2(contentQR2);
            
            setHasChanges(false);

            // 2. TUNGGU RENDER & DOWNLOAD
            timeoutId = setTimeout(() => {
                if (qrRef.current) {
                    handleSaveImage(qrRef, 'B', currentIndexStr, batchRole, batchFileType);
                }
                setAutoIndex(prev => prev + 1);
            }, 1000); 
        };

        runAutoSequence();

        return () => clearTimeout(timeoutId);
    }, [isAutoRunning, autoIndex, autoEndIndex, batchRole, batchFileType]);


    // =================================================================
    // FUNGSI UTILITIES
    // =================================================================

    const handleGenerate = () => {
        const index = parseInt(indexStr || '1', 10)
        const index2 = index + 10000
        const btName = generateName('BT', index)
        const rmName = generateName('RM', index2)
        const address = generateAddress(index)
        const address2 = generateAddress(index2)
        const password = generatePasswordByRole(role)
        
        setQr1(`${btName}|${address}|${password}`)
        setQr2(`${rmName}|${address2}|${password}`)
        
        setLastGeneratedIndex(indexStr)
        setLastGeneratedRole(role)
        setHasChanges(false)
    }
    
    const handlePrint = () => {
        if (hasChanges && !isAutoRunning) {
            alert(' Data berubah! Klik Generate dulu.')
            return
        }
        if (!qr1) return;
        try {
            printMutation.mutate({ qr1, qr2, printerName: selectedPrinter })
        } catch (error) { console.log(error) }
    }

    const handleCalibrateLabel = () => {
        try { lCalibrateMutation.mutate({ printerName: selectedPrinter }) } 
        catch (error) { console.log(error) }
    }

    const handleStartBatch = () => {
        const start = parseInt(batchStart);
        const end = parseInt(batchEnd);

        if (isNaN(start) || isNaN(end) || start > end) {
            alert(" Error: Pastikan Start Index lebih kecil dari End Index.");
            return;
        }

        if (confirm(`Mulai Download Batch?\n\nIndex: ${start} s/d ${end}\nRole: ${batchRole}\nType: .${batchFileType}`)) {
            setAutoIndex(start);
            setAutoEndIndex(end);
            setIsAutoRunning(true);
        }
    }

    const handleSaveImage = (
        qrReference: React.RefObject<HTMLDivElement>, 
        prefix: string,
        forceIndex?: string, 
        forceRole?: string,
        fileType: 'png' | 'jpeg' = 'png'
    ) => {
        if (!qrReference.current) return;
        const originalCanvas = qrReference.current.querySelector('canvas');
        if (!originalCanvas) return;

        const isAutoCall = forceIndex !== undefined;
        const finalIndex = isAutoCall ? forceIndex : indexStr;
        const finalRole = isAutoCall ? forceRole : role;

        if (!isAutoCall) {
            if (hasChanges) { alert('⚠️ Generate dulu!'); return; }
            if (!qr1) { alert('⚠️ QR kosong!'); return; }
        }

        const formattedIndex = finalIndex?.padStart(3, '0') || '000'; 
        const roleCode = finalRole ? finalRole.charAt(0).toUpperCase() : 'U';
        const labelText = `${prefix}${formattedIndex}${roleCode}`;

        const padding = 50; 
        const textAreaHeight = 60; 
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        if (!ctx) return;

        newCanvas.width = originalCanvas.width + (padding * 2);
        newCanvas.height = originalCanvas.height + (padding * 2) + textAreaHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        
        ctx.drawImage(originalCanvas, padding, padding);

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, newCanvas.width / 2, padding + originalCanvas.height + 40);

        const link = document.createElement('a');
        const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
        link.href = newCanvas.toDataURL(mimeType, 1.0);
        const extension = fileType === 'png' ? 'png' : 'jpg';
        link.download = `Label_${labelText}.${extension}`; 
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Komponen Info Table
    const InfoTable = ({ qrRef, prefix }: { qrRef: React.RefObject<HTMLDivElement>, prefix: string }) => (
        <><table className="qr-info-table">
            <tbody>
                <tr><td className="qr-info-label">Index</td><td className="qr-info-value">{indexStr}</td></tr>
                <tr><td className="qr-info-label">Role</td><td className="qr-info-value">{role}</td></tr>
                <tr>
                    <td className="qr-info-label">Status</td>
                    <td className="qr-info-value">
                        {hasChanges ? <span className="status-red">Need Generate</span> : <span className="status-green">Ready</span>}
                    </td>
                </tr>
            </tbody>
        </table>
        <div className="button-group-sm">
            <button onClick={() => handleSaveImage(qrRef, prefix, undefined, undefined, 'png')} className="btn btn-sm btn-outline-primary" disabled={isAutoRunning}>
                Save PNG
            </button>
            <button onClick={() => handleSaveImage(qrRef, prefix, undefined, undefined, 'jpeg')} className="btn btn-sm btn-outline-secondary" disabled={isAutoRunning}>
                Save JPG
            </button>
        </div></>
    );

    return (
        <div className="page-container">
            <h1 className="page-title">QR Code Printer System</h1>
            
            {hasChanges && !isAutoRunning && (
                <div className="warning-banner">
                     Data telah diubah. Silakan tekan <b>Generate QR</b> untuk memperbarui preview.
                </div>
            )}

            {/* --- MANUAL CONTROL --- */}
            <div className='control-panel'>
                <div className="input-group">
                    <label className="input-label">Index Number</label>
                    <input type="text" maxLength={5} value={indexStr} onChange={(e) => setIndexStr(e.target.value.replace(/\D/g, ''))} className="form-input" />
                </div>
                <div className="input-group">
                    <label className="input-label">User Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as any)} className="form-select">
                        <option value="USER">USER</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="PRODUCTION">PRODUCTION</option>
                        <option value="SUPERUSER">SUPERUSER</option>
                    </select>
                </div>
                <div className="input-group">
                    <label className="input-label">Select Printer</label>
                    <select value={selectedPrinter} onChange={(e) => setSelectedPrinter(e.target.value)} className="form-select">
                        {printers.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            <div className='action-buttons'>
                <button onClick={handleGenerate} className="btn btn-primary">Generate QR</button>
                <button onClick={handleCalibrateLabel} className="btn btn-primary">Calibrate</button>
                <button onClick={handlePrint} className="btn btn-primary">Print</button>
            </div>

            {/* --- QR PREVIEW --- */}
            <div className='qr-section'>
                {/* BLUETOOTH CARD */}
                <div ref={qrRef} className="qr-card">
                    <div className="qr-header">Bluetooth</div>
                    {qr1 ? (
                        <>
                            <QRCodeCanvas value={qr1} size={280} level="H" />
                            <InfoTable qrRef={qrRef} prefix="B" />
                            <div className="qr-raw-text">{qr1}</div>
                        </>
                    ) : <div className="empty-state"><p>No Data</p></div>}
                </div>

                {/* REMOTE CARD */}
                <div ref={qrRef2} className="qr-card">
                    <div className="qr-header">Remote</div>
                    {qr2 ? (
                        <>
                            <QRCodeCanvas value={qr2} size={280} level="H" />
                            <InfoTable qrRef={qrRef2} prefix="R" />
                            <div className="qr-raw-text">{qr2}</div>
                        </>
                    ) : <div className="empty-state"><p>No Data</p></div>}
                </div>
            </div>

            {/* --- BATCH DOWNLOAD SECTION --- */}
            <div className="batch-container">
                <h3 className="batch-title"> Batch Download (Bluetooth)</h3>
                
                <div className="batch-grid">
                    <div>
                        <label className="input-label">Start Index</label>
                        <input 
                            type="number" 
                            className="form-input" 
                            value={batchStart} 
                            onChange={(e) => setBatchStart(e.target.value)} 
                            disabled={isAutoRunning}
                        />
                    </div>

                    <div>
                        <label className="input-label">End Index</label>
                        <input 
                            type="number" 
                            className="form-input" 
                            value={batchEnd} 
                            onChange={(e) => setBatchEnd(e.target.value)} 
                            disabled={isAutoRunning}
                        />
                    </div>

                    <div>
                        <label className="input-label">Role</label>
                        <select 
                            className="form-select" 
                            value={batchRole} 
                            onChange={(e) => setBatchRole(e.target.value as any)}
                            disabled={isAutoRunning}
                        >
                            <option value="USER">USER</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="PRODUCTION">PRODUCTION</option>
                            <option value="SUPERUSER">SUPERUSER</option>
                        </select>
                    </div>

                    <div>
                        <label className="input-label">File Type</label>
                        <select 
                            className="form-select" 
                            value={batchFileType} 
                            onChange={(e) => setBatchFileType(e.target.value as any)}
                            disabled={isAutoRunning}
                        >
                            <option value="png">PNG Image</option>
                            <option value="jpeg">JPG Image</option>
                        </select>
                    </div>

                    <div>
                        <button 
                            onClick={handleStartBatch}
                            className={`btn btn-block ${isAutoRunning ? 'btn-danger' : 'btn-primary'}`}
                            disabled={isAutoRunning}
                        >
                            {isAutoRunning ? `Processing ${autoIndex}...` : 'Start Batch Download'}
                        </button>
                    </div>
                </div>
                
                {isAutoRunning && (
                    <p className="batch-warning-text">
                         Mohon jangan tutup halaman ini sampai proses selesai.
                    </p>
                )}
            </div>

        </div>
    )
}