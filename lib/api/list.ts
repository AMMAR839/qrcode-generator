export const getPrinters = async () => { 
    try {
        const res = await fetch('api/v1/printers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        })

        if (!res.ok) {
            throw new Error('Failed to Get Printers')
        }

        return await res.json()
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Error Get Printers'
        )
    }
}