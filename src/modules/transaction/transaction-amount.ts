const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const maxAmountMinor = '9223372036854775807';
const amountMinorPattern = /^[1-9]\d*$/;

interface TransactionAmountParseSuccess {
    success: true;
    amountMinor: string;
}

interface TransactionAmountParseFailure {
    success: false;
    message: string;
}

export type TransactionAmountParseResult =
    | TransactionAmountParseSuccess
    | TransactionAmountParseFailure;

function compareIntegerStrings(left: string, right: string): number {
    if (left.length !== right.length) {
        return left.length > right.length ? 1 : -1;
    }

    if (left === right) {
        return 0;
    }

    return left > right ? 1 : -1;
}

export function safeParseTransactionAmountToMinorUnits(
    amount: string,
): TransactionAmountParseResult {
    const normalizedAmount = amount.trim();

    if (normalizedAmount.length === 0) {
        return {
            success: false,
            message: 'amount is required',
        };
    }

    if (!amountPattern.test(normalizedAmount)) {
        return {
            success: false,
            message: 'amount must be a decimal string with up to 2 fractional digits',
        };
    }

    const [wholePart = '', fractionPart = ''] = normalizedAmount.split('.');
    const normalizedWholePart = wholePart.replace(/^0+/, '') || '0';
    const amountMinor = `${normalizedWholePart}${fractionPart.padEnd(2, '0')}`
        .replace(/^0+/, '') || '0';

    if (amountMinor === '0') {
        return {
            success: false,
            message: 'amount must be greater than 0',
        };
    }

    if (compareIntegerStrings(amountMinor, maxAmountMinor) > 0) {
        return {
            success: false,
            message: 'amount is too large',
        };
    }

    return {
        success: true,
        amountMinor,
    };
}

export function formatTransactionAmountFromMinorUnits(
    amountMinor: string,
): string {
    const normalizedAmountMinor = amountMinor.trim();

    if (!amountMinorPattern.test(normalizedAmountMinor)) {
        throw new Error('amountMinor must be a positive integer string');
    }

    const wholePart = normalizedAmountMinor.length > 2
        ? normalizedAmountMinor.slice(0, -2)
        : '0';
    const fractionPart = normalizedAmountMinor.slice(-2).padStart(2, '0');

    return `${wholePart}.${fractionPart}`;
}
