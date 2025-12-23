import { printerController } from "@/server/modules/printer/printer.controller";

export async function GET() {
    return await printerController.getListPrinters()
}