import { Context } from './types';
import { BackendPlant, BackendAnimal } from '@mono/validations-api';
import { Decoder, TypeOf } from 'io-ts/Decoder';
import { parse } from '@mono/utils-common';

const database = {
  plants: [] as Array<TypeOf<typeof BackendAnimal>>,
  animals: [] as Array<TypeOf<typeof BackendPlant>>,
};

const createTable = <A, B>(scope: Array<any>, schema: Decoder<A, B>) => ({
  create: async (val: any) => {
    const res = await parse(schema, val);
    return res.success
      ? Promise.resolve(scope.push(val) - 1)
      : Promise.reject(res.errors);
  },
  get: async (id: number) =>
    scope.length > id ? scope[id] : Promise.reject(new Error('not_found')),
});

export const context = (): Context => ({
  plant: createTable(database.plants, BackendPlant),
  animal: createTable(database.animals, BackendAnimal),
});
