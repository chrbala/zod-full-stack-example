import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';
import * as E from 'io-ts/Encoder';
import { pipe } from 'fp-ts/function';

import { PlantLifecycle } from '@mono/resolver-typedefs';

const encoder: E.Encoder<string, unknown> = {
  encode: String,
};

export const ID = {
  decoder: D.string,
  encoder: E.encoder,
};

export const name = D.string;
export const lifespan = D.number;

export const lifecycle = D.union(
  D.literal(PlantLifecycle.Deciduous),
  D.literal(PlantLifecycle.Evergreen),
  D.literal(PlantLifecycle.SemiDeciduous)
);
