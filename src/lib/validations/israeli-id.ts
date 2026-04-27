/**
 * Israeli ID (Teudat Zehut) Validation Utility
 * 
 * Algorithm:
 * 1. Trim input.
 * 2. Reject if length < 5 or > 9 or contains non-digits.
 * 3. Pad with leading zeros to 9 digits.
 * 4. For each digit:
 *    - Multiply alternately by 1, 2, 1, 2...
 *    - If result > 9, subtract 9.
 * 5. Sum all results.
 * 6. If sum % 10 === 0 => valid, else invalid.
 */
export function validateIsraeliID(id: string | number): boolean {
    const strId = String(id).trim();

    // Reject if contains non-digits or length is out of bounds
    if (!/^\d+$/.test(strId) || strId.length < 5 || strId.length > 9) {
        return false;
    }

    // Pad with leading zeros to 9 digits
    const paddedId = strId.padStart(9, '0');

    // Algorithm implementation
    const sum = paddedId.split('').reduce((acc, digit, index) => {
        const num = parseInt(digit, 10);
        const step = (index % 2 === 0) ? 1 : 2;
        let res = num * step;

        if (res > 9) {
            res -= 9;
        }

        return acc + res;
    }, 0);

    return sum % 10 === 0;
}

/**
 * Formats a string to be a valid 9-digit Israeli ID (with leading zeros if needed)
 */
export function formatIsraeliID(id: string | number): string {
    return String(id).trim().padStart(9, '0');
}
