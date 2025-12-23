const baseAddress = [0x01, 0x23, 0x45] // Prefix BT address

// Pseudorandom PRNG bijective shuffle (based on seed)
function prng(seed: number): number {
    const a = 1103515245
    const c = 12345
    const m = 2 ** 31
    return (a * seed + c) % m
}

function scramble(index: number): number {
    const seed = 12345
    return prng(index + seed) % 0xffffff // 3 bytes
}

function unscramble(scrambled: number): number {
    for (let i = 0; i < 100000; i++) {
        if (scramble(i) === scrambled) return i
    }
    return -1
}

export function generateAddress(index: number): string {
    const rand = scramble(index)
    const b3 = (rand >> 16) & 0xff
    const b4 = (rand >> 8) & 0xff
    const b5 = rand & 0xff
    return [...baseAddress, b3, b4, b5].map((b) => b.toString(16).padStart(2, '0')).join(':')
}

export function getIndexFromAddress(addr: string): number {
    const parts = addr.split(':').map((p) => parseInt(p, 16))
    const scrambled = (parts[3] << 16) | (parts[4] << 8) | parts[5]
    return unscramble(scrambled)
}
