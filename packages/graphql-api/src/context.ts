import { Context } from './types';
import { BackendPlant, BackendAnimal } from '@mono/validations-api';
import { Decoder, TypeOf } from 'io-ts/Decoder';
import { parse } from '@mono/utils-common';
import { Graph } from 'graphlib';

const database = {
  plants: [] as Array<TypeOf<typeof BackendAnimal>>,
  animals: [] as Array<TypeOf<typeof BackendPlant>>,
  diets: new Graph(),
};

const createTable = <A, B>(scope: Array<any>, schema: Decoder<A, B>) => ({
  create: async (val: any) => {
    const res = await parse(schema, val);
    return res.success
      ? Promise.resolve(scope.push(res.data) - 1)
      : Promise.reject(res.errors);
  },
  get: async (id: number) => {
    if (id >= scope.length) return Promise.reject(new Error('not_found'));
    const res = await parse(schema, scope[id]);
    return res.success ? res.data : Promise.reject('parse_error');
  },
});

const getDiet = async (id: string) => {
  const outEdges = database.diets.outEdges(id);
  const inEdges = database.diets.inEdges(id);

  if (!outEdges || !inEdges) return Promise.reject(new Error('not_found'));

  const diet = outEdges.map(({ w }) => w);
  const eatenBy = inEdges.map(({ v }) => v);

  return { diet, eatenBy };
};

export const context = (): Context => ({
  plant: createTable(database.plants, BackendPlant),
  animal: createTable(database.animals, BackendAnimal),
  diet: {
    get: getDiet,
    set: async (id, diets) => {
      if (!database.diets.hasNode(id)) database.diets.setNode(id);

      diets.diet.forEach(outEdge => database.diets.setEdge(id, outEdge));
      diets.eatenBy.forEach(inEdge => database.diets.setEdge(inEdge, id));

      return getDiet(id);
    },
  },
});
