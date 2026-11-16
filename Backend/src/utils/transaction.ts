import mongoose, { ClientSession } from 'mongoose';

const isTransactionUnsupportedError = (error: any): boolean => {
  const code = error?.code ?? error?.cause?.code;
  const codeName = error?.codeName ?? error?.cause?.codeName;
  const message = String(error?.message || error?.cause?.message || '');

  return (
    code === 20 ||
    codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(message) ||
    /ReplicaSet/i.test(message) && /not a replica set/i.test(message)
  );
};

/**
 * Executes a callback inside a MongoDB transaction when the deployment supports transactions
 * (replica set / mongos), and falls back cleanly on standalone local MongoDB instances while still
 * propagating real application or database failures.
 */
export const runWithTransaction = async <T>(
  work: (session: ClientSession | null) => Promise<T>
): Promise<{ result: T; usedTransaction: boolean }> => {
  let session: ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (startErr: any) {
    if (session) {
      await session.endSession().catch(() => {});
    }
    if (isTransactionUnsupportedError(startErr)) {
      const result = await work(null);
      return { result, usedTransaction: false };
    }
    throw startErr;
  }

  try {
    const result = await work(session);
    await session.commitTransaction();
    return { result, usedTransaction: true };
  } catch (err: any) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    if (isTransactionUnsupportedError(err)) {
      await session.endSession().catch(() => {});
      const result = await work(null);
      return { result, usedTransaction: false };
    }
    throw err;
  } finally {
    await session.endSession().catch(() => {});
  }
};

