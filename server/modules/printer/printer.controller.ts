import { helper } from '@/utils/helper'
import { NextRequest } from 'next/server'
import { calibrateLabel, generateZPL, getListPrinters, sendToPrinter } from './printer.service'

export const printerController = {
    generateQR: async (req: NextRequest) => {
        const body = await req.json()
        const { qr1, qr2, printerName } = body as { qr1: string; qr2: string; printerName: string }
        
        if (!qr1 || !qr2) return helper.response(400, false, 'Missing QR Codes')
            
        const zpl = generateZPL(qr1, qr2)
            
        try {  
            await sendToPrinter(zpl, printerName)
            return helper.response(200, true, 'Print QR Success')
        } catch (error) {
            const err = error instanceof Error
            return helper.response(
                500,
                false,
                err ? error.message : 'Internal Server Error'
            )
        }
    },

    calibrateLabel: async (req: NextRequest) => {
        const body = await req.json()
        const { printerName } = body as { printerName: string }
        
        const zpl = calibrateLabel()
        try {
            await sendToPrinter(zpl, printerName)
            return helper.response(200, true, 'Calibrate Label Success')
        } catch (error) {
            const err = error instanceof Error
            return helper.response(
                500,
                false,
                err ? error.message : 'Internal Server Error'
            )
        }
    },

    getListPrinters: async () => {
        try {
            const printers = await getListPrinters()
            return helper.response(200, true, 'Get List Printers Success', printers)
        } catch (error) {
            const err = error instanceof Error
            return helper.response(
                500,
                false,
                err ? error.message : 'Internal Server Error'
            )
        }
    }
}