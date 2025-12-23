import { writeFile, unlink } from 'fs/promises'
import { exec } from 'child_process'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { helper } from '@/utils/helper'

export const generateZPL = (qr1: string, qr2: string) => {
    return `
        ^XA
        ^PW560
        ^LL112

        ^FO100,10
        ^BQN,2,3
        ^FDLA,${qr1}^FS
        
        ^FO370,10
        ^BQN,2,3
        ^FDLA,${qr2}^FS
        
        ^XZ
    `.trim()
}

export const calibrateLabel = () => {
    return `
        ^XA

        ^JUS
        ^JUF
        
        ^XZ
    `.trim()
}

const execAsync = promisify(exec)

export const sendToPrinter = async (zpl: string, printerName: string) => {
    if (!zpl || !printerName) throw new Error('Missing ZPL or Printer Name')

    const tmpFilePath = path.join(os.tmpdir(), `zpl-${Date.now()}.zpl`)
    await writeFile(tmpFilePath, zpl)

    const platform = os.platform()
    let command: string = ''

    if (platform === 'win32') {
        // Windows: assumes RawPrint.exe is in the same folder (or use full path)
        const exePath = path.join(process.cwd(), 'bin', 'RawPrinter.exe')
        command = `"${exePath}" "${printerName}" "${tmpFilePath}"`
    } else {
        // macOS/Linux: send to printer named "ZTC-ZD220-203dpi-ZPL"
        command = `lp -d "${printerName}" -o raw "${tmpFilePath}"`
    }
    await execAsync(command)

    await unlink(tmpFilePath).catch(err => console.error(err))
}

export const getListPrinters = async () => { 
    const platform = os.platform()
    let command: string = ''

    if (platform === 'win32') {
        command = 'wmic printer get name'
    } else { 
        command = 'lpstat -a'
    }

    const { stdout } = await execAsync(command)

    const printers = platform === 'win32'
        ? helper.parseWmicPrinters(stdout)
        : helper.parseLpstatPrinters(stdout)
    
    return printers
}
