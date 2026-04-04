import {
    formatTransactionAmountFromMinorUnits,
} from '#src/modules/transaction/transaction-amount';
import type {Transaction} from '#src/modules/transaction/transaction.repository';
import type {TransactionResponse} from '#src/modules/transaction/transaction.schema';

export function toTransactionResponse(
    transaction: Transaction,
): TransactionResponse {
    return {
        id: transaction.id,
        kind: transaction.kind,
        categoryId: transaction.categoryId,
        category: {
            id: transaction.category.id,
            name: transaction.category.name,
            iconKey: transaction.category.iconKey,
            color: transaction.category.color,
        },
        amount: formatTransactionAmountFromMinorUnits(transaction.amountMinor),
        description: transaction.description,
        occurredAt: transaction.occurredAt.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
    };
}

export function toTransactionListResponse(
    transactions: Transaction[],
): TransactionResponse[] {
    return transactions.map(toTransactionResponse);
}
