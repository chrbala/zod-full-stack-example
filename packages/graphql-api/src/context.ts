import { Context, TableType, Diet } from './types';
import {
  BackendPlant,
  BackendAnimal,
  BackendPlantPatchInput,
  BackendAnimalPatchInput,
} from '@mono/validations-api';
import { Decoder, TypeOf } from 'io-ts/Decoder';
import { parse } from '@mono/utils-common';
import { id as ID } from '@mono/validations-api';
import { Graph } from 'graphlib';
import { Table } from '@mono/utils-server';

type TableData<T> = Array<T | null>;

const database = {
  plants: [] as TableData<TypeOf<typeof BackendAnimal>>,
  animals: [] as TableData<TypeOf<typeof BackendPlant>>,
  diets: new Graph(),
};

const createTable = <T>(
  scope: Array<any>,
  schema: Decoder<unknown, T>,
  patch: Decoder<unknown, Partial<T>>
): TableType<T> => {
  const create = async (val: unknown) => {
    const res = await parse(schema, val);
    return res.success
      ? Promise.resolve(scope.push(res.data) - 1)
      : Promise.reject(res.errors);
  };

  const get = async (id: number) => {
    const value = scope[id];
    if (!value) return Promise.reject(new Error('not_found'));

    const res = await parse(schema, value);
    return res.success ? res.data : Promise.reject('parse_error');
  };

  const update = async (id: number, value: unknown): Promise<T> => {
    const input = await parse(patch, value);

    if (!input.success) return Promise.reject('not_found');

    const persisted = await get(id);
    return (scope[id] = { ...persisted, ...input.data });
  };

  const deleteEl = async (id: number) => {
    if (id >= scope.length) return Promise.reject('not_found');

    const deleted = !!scope[id];
    scope[id] = null;

    return { deleted };
  };

  return {
    create,
    get,
    update,
    delete: deleteEl,
  };
};

const idsAreValid = (
  ids: Array<string>,
  context: Pick<Context, 'plant' | 'animal'>
): Promise<boolean> =>
  Promise.all(
    ids.map(async id => {
      const res = await parse(ID, id);
      if (!res.success) return Promise.reject(res.errors);

      const table =
        res.data.table === Table.Animal ? context.animal : context.plant;

      return table.get(res.data.id);
    })
  ).then(
    () => true,
    () => false
  );

const createDiet = (ctx: Pick<Context, 'plant' | 'animal'>) => {
  const getDiet = async (id: string) => {
    const outEdges = database.diets.outEdges(id);
    const inEdges = database.diets.inEdges(id);

    if (!outEdges || !inEdges) return Promise.reject(new Error('not_found'));

    const diet = outEdges.map(({ w }) => w);
    const eatenBy = inEdges.map(({ v }) => v);

    return { diet, eatenBy };
  };

  const setDiet = async (id: string, diets: Diet) => {
    const allIds = [id, ...diets.diet, ...diets.eatenBy];
    if (!idsAreValid(allIds, ctx)) return Promise.reject('not_found');

    if (!database.diets.hasNode(id)) database.diets.setNode(id);

    diets.diet.forEach(outEdge => database.diets.setEdge(id, outEdge));
    diets.eatenBy.forEach(inEdge => database.diets.setEdge(inEdge, id));

    return getDiet(id);
  };

  const updateDiet = async (
    id: string,
    diets: Partial<Diet>
  ): Promise<Diet> => {
    const allIds = [id, ...(diets.diet ?? []), ...(diets.eatenBy ?? [])];
    if (!idsAreValid(allIds, ctx)) return Promise.reject('not_found');

    if (!database.diets.hasNode(id)) database.diets.setNode(id);

    const inEdges = database.diets.inEdges(id);
    if (inEdges && diets.eatenBy)
      inEdges.forEach(e => database.diets.removeEdge(e));

    const outEdges = database.diets.outEdges(id);
    if (outEdges && diets.diet)
      outEdges.forEach(e => database.diets.removeEdge(e));

    return setDiet(id, {
      diet: diets.diet ?? [],
      eatenBy: diets.eatenBy ?? [],
    });
  };

  return {
    get: getDiet,
    set: setDiet,
    update: updateDiet,
  };
};

export const context = (): Context => {
  const Plants = createTable(
    database.plants,
    BackendPlant,
    BackendPlantPatchInput
  );
  const Animals = createTable(
    database.animals,
    BackendAnimal,
    BackendAnimalPatchInput
  );

  return {
    plant: Plants,
    animal: Animals,
    diet: createDiet({ plant: Plants, animal: Animals }),
  } as Context;
};
