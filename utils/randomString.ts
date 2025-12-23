const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export function generateName(prefix: string, index: number): string {
    const rand = seededRandom(index)
    let result = ''
    for (let i = 0; i < 4; i++) {
        const charIndex = Math.floor(rand() * charset.length)
        result += charset[charIndex]
    }
    return `${prefix}${result}`
}

export function generatePasswordByRole(role: string): string {
    const seed = hashStringToSeed(role)
    const rand = seededRandom(seed)
    let result = ''
    for (let i = 0; i < 5; i++) {
        const charIndex = Math.floor(rand() * charset.length)
        result += charset[charIndex]
    }
    return result
}

// Hash string to numeric seed
function hashStringToSeed(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash)
}

function seededRandom(seed: number): () => number {
    return function () {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
    }
}