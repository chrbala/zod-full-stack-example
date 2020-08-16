import { Schema, ZodError, ZodErrorCode } from 'zod';

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

export const safeExecAsync = <T extends any>(
  cb: () => Promise<T>
): Promise<ExecResult<T>> => {
  // check for sync errors
  const res = safeExec(cb);
  if (!res.success) return Promise.resolve(res);

  return Promise.resolve(res.data).then(
    data => ({ success: true, data }),
    error => ({ success: false, error: asError(error) })
  );
};

type ParseError = {
  code: string;
  path: Array<string>;
};
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<ParseError> };
export const parse = async <T>(
  schema: Schema<T>,
  data: unknown
): Promise<ParseResult<T>> => {
  const res = await safeExecAsync(() => schema.parseAsync(data));
  if (res.success) return res;

  if (res.error instanceof ZodError) {
    return {
      success: false,
      errors: res.error.errors.map(({ code, message, path, ...rest }) => ({
        path: path.map(String),
        code: code === ZodErrorCode.custom_error ? message : code,
        ...rest,
      })),
    };
  }

  throw res.error;
};
