import { BackendPlant, BackendAnimal } from '@mono/validations-api';
import * as z from 'zod';

export type Context = {
  plant: {
    get: (id: number) => Promise<any>;
    create: (value: z.TypeOf<typeof BackendPlant>) => Promise<number>;
  };
  animal: {
    get: (id: number) => Promise<any>;
    create: (value: z.TypeOf<typeof BackendAnimal>) => Promise<number>;
  };
};
