const asError = (e: unknown) =>
  e instanceof Error ? e : typeof e === 'string' ? new Error(e) : new Error();

export type ExecResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: Error;
    };

export const safeExec = <T extends any>(cb: () => T): ExecResult<T> => {
  try {
    return { success: true, data: cb() };
  } catch (e) {
    return { success: false, error: asError(e) };
  }
};
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Either';

type ParseError = {
  code: string;
  path: Array<string>;
};
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<ParseError> };
export const parse = <A, B>(
  schema: D.Decoder<A, B>,
  data: any
): Promise<ParseResult<B>> => {
  return new Promise(resolve =>
    pipe(
      schema.decode(data),
      fold(
        errors => resolve({ success: false, errors: [] }), // TODO
        data => resolve({ success: true, data })
      )
    )
  );
};

export const isPresent = <T extends any>(
  value: T | undefined | null
): value is T => value !== null && value !== undefined;
