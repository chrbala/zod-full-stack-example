import { BackendPlant, BackendAnimal } from '@mono/validations-api';
import { TypeOf } from 'io-ts/Decoder';
import { NullablePartial } from '@mono/utils-common';

export type Diet = {
  diet: Array<string>;
  eatenBy: Array<string>;
};

export type TableType<T> = {
  get: (id: number) => Promise<T>;
  create: (value: unknown) => Promise<number>;
  update: (id: number, value: Partial<unknown>) => Promise<T>;
  delete: (id: number) => Promise<{ deleted: boolean }>;
};

export type Context = {
  plant: TableType<TypeOf<typeof BackendPlant>>;
  animal: TableType<TypeOf<typeof BackendAnimal>>;
  diet: {
    get: (id: string) => Promise<Diet>;
    set: (id: string, diet: Diet) => Promise<Diet>;
    update: (id: string, diet: NullablePartial<Diet>) => Promise<Diet>;
  };
};
