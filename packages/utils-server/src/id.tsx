import Hashids from 'hashids/cjs';
import { safeExec } from '@mono/utils-common';

export enum Table {
  Animal = 0,
  Plant = 1,
}

const salt = 'hANklaTERciUmpkiStERAVEnGtoRnaLI';
const hashids = new Hashids(salt, 0, 'abcdefghijklmnopqrstuvwxyz1234567890');

type IdType = number;
export type DeserializedGlobalId = {
  table: Table;
  id: IdType;
};

export const toGlobalId = ({ table, id }: DeserializedGlobalId) =>
  hashids.encode(table, id);

enum ErrorCode {
  INVALID_HASH,
  INVALID_LENGTH,
  INVALID_TABLE_ID_TYPE,
  INVALID_ID_TYPE,
  INVALID_ID,
  INVALID_TABLE,
}

interface ErrorDataI<T extends {} | undefined> {
  type: ErrorCode;
  data?: T;
}

type HashErrorData = { message: string };
interface HashError extends ErrorDataI<HashErrorData> {
  type: ErrorCode.INVALID_HASH;
  data: HashErrorData;
}

type InvalidLengthData = {
  values: Array<number | bigint>;
};
interface InvalidLengthError extends ErrorDataI<InvalidLengthData> {
  type: ErrorCode.INVALID_LENGTH;
  data: InvalidLengthData;
}

type TableIDTypeErrorData = {
  tableId: number | bigint;
};
interface TableIDTypeError extends ErrorDataI<TableIDTypeErrorData> {
  type: ErrorCode.INVALID_TABLE_ID_TYPE;
  data: TableIDTypeErrorData;
}

type IDTypeErrorData = {
  id: number | bigint;
};
interface IDTypeError extends ErrorDataI<IDTypeErrorData> {
  type: ErrorCode.INVALID_ID_TYPE;
  data: IDTypeErrorData;
}

type TableIDErrorData = {
  tableId: number;
};
interface TableIDError extends ErrorDataI<TableIDErrorData> {
  type: ErrorCode.INVALID_TABLE;
  data: TableIDErrorData;
}

type ErrorData =
  | HashError
  | InvalidLengthError
  | TableIDTypeError
  | IDTypeError
  | TableIDError;

class ValidationError extends Error {
  readonly data: ErrorData;
  readonly name: string;

  constructor(data: ErrorData) {
    super();
    this.data = data;
    this.name = ErrorCode[data.type];
  }
}

const verifyTable = (value: number) => !!Table[value];

export const fromGlobalId = (
  encoded: string
): DeserializedGlobalId | ValidationError => {
  const res = safeExec(() => hashids.decode(encoded));
  if (!res.success)
    return new ValidationError({
      type: ErrorCode.INVALID_HASH,
      data: {
        message: res.error.message,
      },
    });

  const val = res.data;
  if (val.length !== 2)
    return new ValidationError({
      type: ErrorCode.INVALID_LENGTH,
      data: {
        values: val,
      },
    });

  const [tableId, id] = val;
  if (typeof tableId != 'number')
    return new ValidationError({
      type: ErrorCode.INVALID_TABLE_ID_TYPE,
      data: { tableId },
    });

  if (typeof id != 'number')
    return new ValidationError({
      type: ErrorCode.INVALID_ID_TYPE,
      data: { id },
    });

  if (!verifyTable(tableId))
    return new ValidationError({
      type: ErrorCode.INVALID_TABLE,
      data: { tableId },
    });

  return { table: tableId, id };
};
