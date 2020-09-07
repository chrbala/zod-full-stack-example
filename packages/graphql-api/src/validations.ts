import * as D from 'io-ts/Decoder';
import { id } from '@mono/validations-api';

export const animalParent = D.partial({
  id,
});

export const plantParent = D.partial({
  id,
});
