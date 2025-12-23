import { printerController } from "@/server/modules/printer/printer.controller";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    return await printerController.calibrateLabel(req)
}