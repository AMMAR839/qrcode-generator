export const printQR = async (qr1: string, qr2: string, printerName?: string) => { 
    try {
        const res = await fetch('api/v1/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                qr1,
                qr2,
                printerName
            }),
            cache: 'no-store',
        })

        if (!res.ok) {
            throw new Error('Failed to print QR')
        }

        return await res.json()
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Error print QR Code'
        )
    }
}


export const calibrateLabel = async (printerName?: string) => {
    try {
        const res = await fetch('api/v1/qrcode/calibrate-label', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                printerName
            }),
            cache: 'no-store',
        })

        if (!res.ok) {
            throw new Error('Failed to Calibrate Label')
        }

        return await res.json()
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Error Calibrate Label'
        )
    }
}