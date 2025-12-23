import { getPrinters } from "@/lib/api/list"
import { calibrateLabel, printQR } from "@/lib/api/printer"
import { useMutation, useQuery } from "@tanstack/react-query"

export const usePrintQR = () => {
    return useMutation({
        mutationFn: ({
            qr1, qr2, printerName
        }: {
            qr1: string
            qr2: string
            printerName: string
        }) =>
            printQR(
                qr1, qr2, printerName
            ),

        onSuccess: data => {
            if (data?.code === 200) {
            } else {
            }
        },
        onError: error => {
            console.error('Error print QR:', error)
        },
    })
}

export const useGetPrinters = () => {
    return useQuery({
        queryKey: ['printers'],
        queryFn: () => getPrinters(),
    })
}

export const useCalibrateLabel = () => {
    return useMutation({
        mutationFn: ({
            printerName
        }: {
            printerName: string
        }) => calibrateLabel(printerName),
        onSuccess: data => {
            if (data?.code === 200) {
            } else {
            }
        },
        onError: error => {
            console.error('Error calibrate label:', error)
        },
    })
}