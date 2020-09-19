import {
  fromEnum,
  min,
  minLength,
  max,
  maxLength,
  int,
} from '@mono/utils-common';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { PlantLifecycle } from '@mono/resolver-typedefs';

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
