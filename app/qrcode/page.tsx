'use client'

import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { generateAddress } from '@/utils/address'
import { generateName, generatePasswordByRole } from '@/utils/randomString'
import { useCalibrateLabel, useGetPrinters, usePrintQR } from '@/hooks/usePrinter'


export default function QRPrintPage() {
    const printMutation = usePrintQR()
    const lCalibrateMutation = useCalibrateLabel()
    const { data } = useGetPrinters()

    const [printers, setPrinters] = useState<string[]>([])
    const [selectedPrinter, setSelectedPrinter] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [indexStr, setIndexStr] = useState('1')
    const [role, setRole] = useState<'USER' | 'MAINTENANCE' | 'PRODUCTION' | 'SUPERUSER'>('USER')

    const [qr1, setQr1] = useState('')
    const [qr2, setQr2] = useState('')

    const qrRef = useRef<HTMLDivElement>(null)
    const qrRef2 = useRef<HTMLDivElement>(null)
    
    // Dummy calls 
    generatePasswordByRole("USER")        
    generatePasswordByRole("MAINTENANCE") 
    generatePasswordByRole("PRODUCTION") 
    generatePasswordByRole("SUPERUSER")   

    useEffect(() => {
        if (data && data.status && data.data && data.data.length > 0) {
            const printerList = data.data;
            setPrinters(printerList)

            if (!selectedPrinter) {
                setSelectedPrinter(printerList[0])
            }
        }
    }, [data, selectedPrinter]); 

    const handleGenerate = () => {
        const index = parseInt(indexStr || '1', 10)
        const index2 = index + 10000
        
        const btName = generateName('BT', index)
        const rmName = generateName('RM', index2)
        const address = generateAddress(index)
        const address2 = generateAddress(index2)
        
        const password = generatePasswordByRole(role)
        
        const content1 = `${btName}|${address}|${password}`
        const content2 = `${rmName}|${address2}|${password}`
        
        setQr1(content1)
        setQr2(content2)
    }
    
    const handlePrint = () => {
        setLoading(true)
        try {
            printMutation.mutate({
                qr1: qr1,
                qr2: qr2,
                printerName: selectedPrinter
            })
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCalibrateLabel = () => {
        setLoading(true)
        try {
            lCalibrateMutation.mutate({
                printerName: selectedPrinter
            })
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveImage = (qrReference: React.RefObject<HTMLDivElement>, prefix: string) => {
        if (!qrReference.current) return;

        const originalCanvas = qrReference.current.querySelector('canvas');
        if (!originalCanvas) return;

        // --- 1. Siapkan Teks Label ---
        const formattedIndex = indexStr.padStart(3, '0'); 
        const roleCode = role.charAt(0).toUpperCase();
        const labelText = `${prefix}${formattedIndex}${roleCode}`;

        // --- 2. Konfigurasi Jarak (Padding) ---
        // Ubah angka ini untuk memperbesar/memperkecil bingkai putih
        const padding = 50; 
        // Ruang tambahan khusus untuk teks di paling bawah
        const textAreaHeight = 60; 

        // --- 3. Buat Canvas Baru yang Lebih Besar ---
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        if (!ctx) return;

        // Lebar Baru = Lebar QR + Padding Kiri + Padding Kanan
        newCanvas.width = originalCanvas.width + (padding * 2);
        // Tinggi Baru = Tinggi QR + Padding Atas + Padding Bawah + Area Teks
        newCanvas.height = originalCanvas.height + (padding * 2) + textAreaHeight;

        // --- 4. Warnai SELURUH background menjadi Putih Mutlak ---
        ctx.fillStyle = '#FFFFFF';
        // Mengisi dari pojok kiri atas (0,0) sampai ujung kanan bawah canvas baru
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

        // --- 5. Gambar QR Code Asli di Tengah ---
        // Kita menggambar originalCanvas bukan di (0,0), tapi digeser
        // sejauh nilai 'padding' ke kanan dan ke bawah.
        ctx.drawImage(originalCanvas, padding, padding);

        // --- 6. Gambar Teks Label di Bawah ---
        ctx.font = 'bold 28px Arial'; // Font sedikit diperbesar agar jelas
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center'; // Teks rata tengah secara horizontal

        // Posisi X: Tepat di tengah lebar canvas baru
        const textXpos = newCanvas.width / 2;
        
        // Posisi Y: Padding atas + Tinggi QR + Jarak sedikit (misal 40px)
        // Ini menempatkan teks di area putih di bawah QR
        const textYpos = padding + originalCanvas.height + 40; 

        ctx.fillText(labelText, textXpos, textYpos);

        // --- 7. Download Image ---
        const link = document.createElement('a');
        // Gunakan kualitas tertinggi ('image/png', 1.0)
        link.href = newCanvas.toDataURL('image/png', 1.0);
        link.download = `Label_${labelText}.png`; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Komponen Reusable untuk Menampilkan Detail Info
    const InfoTable = () => (
        <><table className="qr-info-table">
            <tbody>
                <tr>
                    <td className="qr-info-label">Index ID</td>
                    <td className="qr-info-value">{indexStr || '-'}</td>
                </tr>
                <tr>
                    <td className="qr-info-label">Role</td>
                    <td className="qr-info-value">{role}</td>
                </tr>
                <tr>
                    <td className="qr-info-label">Target Printer</td>
                    <td className="qr-info-value">{selectedPrinter || 'None'}</td>
                </tr>
            </tbody>
        </table></>
    );

    return (
        <div className="page-container">
            <h1 className="page-title">QR Code Printer System</h1>

            {/* CONTROL PANEL */}
            <div className='control-panel'>
                <div className="input-group">
                    <label className="input-label">Index Number</label>
                    <input
                        type="text"
                        maxLength={5}
                        value={indexStr}
                        onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.startsWith('0')) val = val.replace(/^0+/, '')
                            setIndexStr(val)
                        }}
                        className="form-input"
                        placeholder="e.g. 1"
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">User Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="form-select"
                    >
                        <option value="USER">USER</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="PRODUCTION">PRODUCTION</option>
                        <option value="SUPERUSER">SUPERUSER</option>
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Select Printer</label>
                    <select
                        value={selectedPrinter}
                        onChange={(e) => setSelectedPrinter(e.target.value)}
                        className="form-select"
                    >
                        {printers.length === 0 && <option>No printers found</option>}
                        {printers.map((printerName) => (
                            <option key={printerName} value={printerName}>
                                {printerName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className='action-buttons'>
                <button onClick={handleGenerate} className="btn btn-primary">
                Generate QR
                </button>
                <button onClick={handleCalibrateLabel} className="btn btn-primary">
                Calibrate
                </button>
                <button onClick={handlePrint} className="btn btn-primary">
                Print
                </button>

            </div>

            {/* QR PREVIEW SECTION */}
            <div className='qr-section'>
                {/* QR CARD 1 */}
                <div ref={qrRef} className="qr-card">
                    <div className="qr-header">Bluetooth</div>
                    {qr1 ? (
                        <>
                            <QRCodeCanvas value={qr1} size={280} level="H" />
                            {/* Menampilkan Info */}
                            <InfoTable />
                            <div className="qr-raw-text">{qr1}</div>
                            <button onClick={() => handleSaveImage(qrRef, 'B')} className="btn btn-primary2">Save QR as Image</button>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-box" />
                            <p>Waiting for data...</p>
                        </div>
                    )}
                </div>

                {/* QR CARD 2 */}
                <div ref={qrRef2} className="qr-card">
                    <div className="qr-header">Remote</div>
                    {qr2 ? (
                        <>
                            <QRCodeCanvas value={qr2} size={280} level="H" />
                            {/* Menampilkan Info Index, Role, Printer */}
                            <InfoTable />
                            <div className="qr-raw-text">{qr2}</div>
                            <button onClick={() => handleSaveImage(qrRef2, 'R')} className="btn btn-primary2">Save QR as Image</button>
                
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-box" />
                            <p>Waiting for data...</p>
                        </div>
                    )}
                    </div>
            </div>
        </div>
    )
}