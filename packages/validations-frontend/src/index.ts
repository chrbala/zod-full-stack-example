import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { nullablePartial } from '@mono/utils-common';
import {
  name,
  lifespan,
  weight,
  lifecycle,
  diet,
  eatenBy,
} from '@mono/validations-common';
export * from '@mono/validations-common';

export const PlantPatchInput = nullablePartial({
  name,
  lifespan,
  weight,
  lifecycle,
  eatenBy,
});

export const AnimalPatchInput = nullablePartial({
  name,
  lifespan,
  weight,
  diet,
  eatenBy,
});

const LivingThingCommon = D.type({
  name,
  lifespan,
  weight,
});

export const PlantInput = pipe(
  LivingThingCommon,
  D.intersect(D.type({ eatenBy, lifecycle }))
);

export const AnimalInput = pipe(
  LivingThingCommon,
  D.intersect(
    D.type({
      diet,
      eatenBy,
    })
  )
);
