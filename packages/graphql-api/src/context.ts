import { Context, TableType, Diet } from './types';
import {
  BackendPlant,
  BackendAnimal,
  BackendPlantPatchInput,
  BackendAnimalPatchInput,
} from '@mono/validations-api';
import { Decoder, TypeOf } from 'io-ts/Decoder';
import { parse, NullablePartial, isPresent } from '@mono/utils-common';
import { id as ID } from '@mono/validations-api';
import { Graph } from 'graphlib';
import { Table } from '@mono/utils-server';

/*
  This file is an approximation of a persisted data store like a database.
  Because this project primarily exists to illustrate and test validations,
  it does not go truly full stack here and the data store is ephemeral.
  
  
  Additionally, data sources like these would typically be fronted by something
  like dataloader. This doesn't aid in the validation example though, so it's
  not included here.
 */

type TableData<T> = Array<T | null>;

const database = {
  plants: [] as TableData<TypeOf<typeof BackendAnimal>>,
  animals: [] as TableData<TypeOf<typeof BackendPlant>>,
  diets: new Graph(),
};

const createTable = <T>(
  scope: Array<T | null>,
  schema: Decoder<unknown, T>,
  patch: Decoder<unknown, NullablePartial<T>>
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

  const all = async () => {
    const data = await Promise.all(
      scope.map(async (el, i) => {
        if (!el) return null;

        const res = await parse(schema, el);
        if (!res.success) return Promise.reject(res.errors);

        return { id: i, node: res.data };
      })
    );

    return data.filter(isPresent);
  };

  return {
    create,
    get,
    update,
    delete: deleteEl,
    all,
  };
};

type IDValidator = (id: number) => Promise<boolean>;
const validateId = (validators: {
  animal: IDValidator;
  plant: IDValidator;
}) => async (id: string) => {
  const res = await parse(ID, id);
  if (!res.success) return Promise.reject(res.errors);

  const validate =
    res.data.table === Table.Animal ? validators.animal : validators.plant;

  return validate(res.data.id);
};

const idsAreValid = (
  ids: Array<string>,
  validate: (id: string) => Promise<boolean>
): Promise<boolean> =>
  Promise.all(ids.map(validate)).then(
    results => !results.includes(false),
    () => false
  );

const createDiet = (validate: (id: string) => Promise<boolean>) => {
  const getDiet = async (id: string) => {
    const outEdges = database.diets.outEdges(id);
    const inEdges = database.diets.inEdges(id);

    if (!outEdges || !inEdges) return Promise.reject(new Error('not_found'));

    const diet = outEdges.map(({ w }) => w);
    const eatenBy = inEdges.map(({ v }) => v);

    return { diet, eatenBy };
  };

  const init = async (id: string) => {
    if (!(await idsAreValid([id], validate)))
      return Promise.reject('not_found');

    if (!database.diets.hasNode(id)) database.diets.setNode(id);

    return Promise.resolve();
  };

  const setDiet = async (id: string, diets: Diet) => {
    await init(id);

    const allIds = [...diets.diet, ...diets.eatenBy];

    if (!(await idsAreValid(allIds, validate)))
      return Promise.reject('invalid_id');

    diets.diet.forEach(outEdge => database.diets.setEdge(id, outEdge));
    diets.eatenBy.forEach(inEdge => database.diets.setEdge(inEdge, id));

    return getDiet(id);
  };

  const updateDiet = async (
    id: string,
    diets: Partial<Diet>
  ): Promise<Diet> => {
    await init(id);

    const allIds = [...(diets.diet ?? []), ...(diets.eatenBy ?? [])];

    if (!(await idsAreValid(allIds, validate)))
      return Promise.reject('not_found');

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
    diet: createDiet(
      validateId({
        plant: id => Plants.get(id).then(Boolean),
        animal: id => Animals.get(id).then(Boolean),
      })
    ),
  } as Context;
};
