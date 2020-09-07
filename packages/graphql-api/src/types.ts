import { BackendPlant, BackendAnimal } from '@mono/validations-api';
import { TypeOf } from 'io-ts/Decoder';

export type Context = {
  plant: {
    get: (id: number) => Promise<any>;
    create: (value: TypeOf<typeof BackendPlant>) => Promise<number>;
  };
  animal: {
    get: (id: number) => Promise<any>;
    create: (value: TypeOf<typeof BackendAnimal>) => Promise<number>;
  };
};
