import { NextResponse } from "next/server"

type BaseResponse = {
    status: boolean
    code: number
    message: string
}

type GetByIdResponse<T> = BaseResponse & { data: T }
type GetAllResponse<T> = BaseResponse & { data: T; metadata: object }

export const helper = {
    response: <T = unknown>(
        code: number,
        status: boolean,
        message: string,
        data?: T,
        metadata?: object | null,
    ) => {
        let responseBody: BaseResponse | GetByIdResponse<T> | GetAllResponse<T> = {
            status,
            code,
            message,
        }

        if (data && metadata && Object.keys(metadata).length > 0) {
            responseBody = {
            ...responseBody,
            metadata,
            data,
            }
        } else if (data) {
            responseBody = {
            ...responseBody,
            data,
            }
        }

        return NextResponse.json(responseBody, { status: code })
    },

    parseWmicPrinters: (stdout: string): string[] => { 
        return stdout.split('\n').slice(1).map(line => line.trim()).filter(Boolean)
    },

    parseLpstatPrinters: (stdout: string): string[] => { 
        return stdout.split('\n').map(line => line.split(' ')[0]).filter(Boolean)
    }
}