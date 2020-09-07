import * as DE from 'io-ts/DecodeError';
import * as FS from 'io-ts/FreeSemigroup';
import { DecodeError, error } from 'io-ts/Decoder';
import * as E from 'fp-ts/Either';

type PathElType = string;
type PathType = Array<PathElType>;

type ErrorType = {
  input: unknown;
  path: PathType;
  errors: Array<string>;
};

const pathKey = (path: PathType): string => [path.length, ...path].join('.');

const combinePaths = (errors: Array<ErrorType>) => {
  const map: { [key: string]: ErrorType } = {};
  errors.forEach(e => {
    const key = pathKey(e.path);
    map[key] = map[key]
      ? {
          ...map[key],
          errors: [...map[key].errors, ...e.errors],
        }
      : e;
  });

  return Object.values(map);
};

const flatten: (e: DE.DecodeError<string>) => Array<ErrorType> = DE.fold({
  Leaf: (input, error) => [{ input, path: [], errors: [error] }],
  Key: (key, _, errors) =>
    merge(errors).map(e => ({ ...e, path: [key, ...e.path] })),
  Index: (index, _, errors) =>
    merge(errors).map(e => ({ ...e, path: [String(index), ...e.path] })),
  Member: (index, errors) => merge(errors),
  // is this an io-ts bug? why does "null" show up?
  // also possible to get Record<string, unknown> for "error"
  Lazy: (id, errors) =>
    merge(errors)
      .map(e => ({
        ...e,
        errors: e.errors.filter(code => code !== 'null'),
      }))
      .filter(({ errors }) => errors.length),
  // what is this?
  Wrap: (error, errors) => null as any,
});

const merge: (e: DecodeError) => Array<ErrorType> = FS.fold(
  value => flatten(value),
  (left, right) => merge(left).concat(merge(right))
);

export const report: (
  e: E.Either<DecodeError, unknown>
) => Array<ErrorType> = E.fold(
  e => combinePaths(merge(e)),
  () => []
);
