import * as D from 'io-ts/Decoder';
import { id } from '@mono/validations-api';

export const animalParent = D.type({
  id,
});

export const plantParent = D.type({
  id,
});
