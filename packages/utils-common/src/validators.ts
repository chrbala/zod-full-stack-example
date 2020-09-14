import { makeError } from '@mono/utils-common';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

export const WithLength = D.union(D.string, D.UnknownArray);

export const maxLength = (length: number) =>
  pipe(
    WithLength,
    D.parse(s =>
      s.length <= length
        ? D.success(s)
        : D.failure(
            s,
            makeError({
              code: 'too_long',
              client: true,
              params: { maxLength: String(length) },
            })
          )
    )
  );

export const minLength = (length: number) =>
  pipe(
    WithLength,
    D.parse(s =>
      s.length >= length
        ? D.success(s)
        : D.failure(
            s,
            makeError({
              code: 'too_short',
              client: true,
              params: { minLength: String(length) },
            })
          )
    )
  );

export const int = pipe(
  D.number,
  D.parse(n =>
    Number.isInteger(n)
      ? D.success(n)
      : D.failure(
          n,
          makeError({
            code: 'not_int',
            client: true,
          })
        )
  )
);

export const min = ({
  minimum,
  inclusive,
}: {
  minimum: number;
  inclusive: boolean;
}) =>
  pipe(
    D.number,
    D.parse(n =>
      (inclusive ? n >= minimum : n > minimum)
        ? D.success(n)
        : D.failure(
            n,
            makeError({
              code: 'too_small',
              client: true,
              params: {
                minimum: String(minimum),
                inclusive: String(inclusive),
              },
            })
          )
    )
  );

export const max = ({
  maximum,
  inclusive,
}: {
  maximum: number;
  inclusive: boolean;
}) =>
  pipe(
    D.number,
    D.parse(n =>
      (inclusive ? n <= maximum : n < maximum)
        ? D.success(n)
        : D.failure(
            n,
            makeError({
              code: 'too_big',
              client: true,
              params: {
                maximum: String(maximum),
                inclusive: String(inclusive),
              },
            })
          )
    )
  );
