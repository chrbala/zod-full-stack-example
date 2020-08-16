import * as z from 'zod';

import { serializedID } from '@mono/validations-api';

export const animalParent = z
  .object({
    id: serializedID,
  })
  .nonstrict();

export const plantParent = z
  .object({
    id: serializedID,
  })
  .nonstrict();
