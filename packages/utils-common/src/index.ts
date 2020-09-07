import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { fold, left } from 'fp-ts/Either';
import { report } from './reporter';
import { ParseErrors } from './errorCode';
export { makeError, prepareErrorsForTransit } from './errorCode';

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

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: D.TypeOf<typeof ParseErrors> };
export const parse = <A, B>(
  schema: D.Decoder<A, B>,
  data: any
): Promise<ParseResult<B>> => {
  return new Promise(resolve =>
    pipe(
      schema.decode(data),
      fold(
        errors =>
          resolve({
            success: false,
            errors: pipe(
              report(left(errors)),
              ParseErrors.decode,
              fold(
                () => [],
                s => s
              )
            ),
          }),
        data => resolve({ success: true, data })
      )
    )
  );
};

export const isPresent = <T extends any>(
  value: T | undefined | null
): value is T => value !== null && value !== undefined;

export type EnumLike = { [k: string]: string | number; [nu: number]: string };

export function fromEnum<T extends EnumLike>(
  theEnum: T
): D.Decoder<unknown, T> {
  const isEnumValue = (input: unknown): input is T =>
    Object.values<unknown>(theEnum).includes(input);

  return pipe(D.union(D.string, D.number), D.refine(isEnumValue, 'enum'));
}
