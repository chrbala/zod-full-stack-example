import * as D from 'io-ts/Decoder';
import { ID } from '@mono/validations-api';

export const animalParent = D.type({
  id: ID,
});

export const plantParent = D.type({
  id: ID,
});
