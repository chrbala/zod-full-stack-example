import * as D from 'io-ts/Decoder';
import * as C from 'io-ts/Codec';
import { pipe } from 'fp-ts/function';
import { Either, fold, left } from 'fp-ts/Either';
import { report } from './reporter';
import { ParseErrors, ParseErrorData } from './errorCode';
import { DecodeError } from 'io-ts/lib/DecodeError';
export { makeError, prepareErrorsForTransit, ParamsCodec } from './errorCode';

export type ParseErrorDataType = D.TypeOf<typeof ParseErrorData>;

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

export type SuccessResult<T> = { success: true; data: T };
export type ErrorResult = {
  success: false;
  errors: D.TypeOf<typeof ParseErrors>;
};
export type ParseResult<T> = SuccessResult<T> | ErrorResult;

export const parseSync = <A, B>(
  schema: D.Decoder<A, B> | C.Codec<A, any, B>,
  data: any
): ParseResult<B> =>
  pipe(
    schema.decode(data),
    fold(
      errors =>
        ({
          success: false,
          errors: pipe(
            report(left(errors)),
            ParseErrors.decode,
            fold(
              () => [],
              s => s
            )
          ),
        } as ParseResult<B>),
      data => ({ success: true, data })
    )
  );

export const parse = <A, B>(
  schema: D.Decoder<A, B> | C.Codec<A, any, B>,
  data: any
): Promise<ParseResult<B>> => Promise.resolve(parseSync(schema, data));

export const isPresent = <T extends any>(
  value: T | undefined | null
): value is T => value !== null && value !== undefined;

export type EnumLike = { [k: string]: string | number; [nu: number]: string };

export function fromEnum<T extends EnumLike>(
  theEnum: T
): D.Decoder<unknown, T[keyof T]> {
  const isEnumValue = (input: unknown): input is any =>
    Object.values<unknown>(theEnum).includes(input);

  return pipe(D.union(D.string, D.number), D.refine(isEnumValue, 'enum'));
}

export type NullablePartial<A> = Partial<{ [K in keyof A]: A[K] | null }>;

export const nullablePartial = <A>(
  properties: { [K in keyof A]: D.Decoder<unknown, A[K]> }
): D.Decoder<unknown, NullablePartial<A>> => {
  const out: any = {};
  for (const key in properties) {
    out[key] = D.nullable(properties[key]);
  }

  return D.partial(out);
};

export * from './validators';
