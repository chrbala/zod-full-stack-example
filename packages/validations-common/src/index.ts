import { fromEnum, makeError } from '@mono/utils-common';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

import { PlantLifecycle } from '@mono/resolver-typedefs';

const WithLength = D.union(D.string, D.UnknownArray);

const maxLength = (length: number) =>
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

const minLength = (length: number) =>
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

const int = pipe(
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

const min = ({ minimum, inclusive }: { minimum: number; inclusive: boolean }) =>
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

const max = ({ maximum, inclusive }: { maximum: number; inclusive: boolean }) =>
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

export const name = pipe(
  minLength(3),
  D.compose(maxLength(100)),
  D.compose(D.string)
);

export const lifespan = pipe(
  D.number,
  D.compose(int),
  D.compose(min({ minimum: 0, inclusive: false })),
  D.compose(max({ maximum: 400000, inclusive: true }))
);

export const weight = pipe(
  D.number,
  D.compose(min({ minimum: 0, inclusive: false })),
  D.compose(max({ maximum: 2e7, inclusive: true }))
);

export const lifecycle = fromEnum(PlantLifecycle);

export const diet = pipe(
  D.UnknownArray,
  D.compose(maxLength(100)),
  D.compose(D.array(D.string))
);

export const eatenBy = pipe(
  D.UnknownArray,
  D.compose(maxLength(100)),
  D.compose(D.array(D.string))
);
