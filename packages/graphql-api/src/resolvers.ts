import { InputError, DeleteLivingThingPayload } from '@mono/resolver-typedefs';
import {
  LivingThingArgs,
  AddLivingThingArgs,
  IDType,
  id,
  BackendAnimal,
  BackendPlant,
  UpdateLivingThingArgs,
  DeleteLivingThingArgs,
} from '@mono/validations-api';
import { parse, prepareErrorsForTransit } from '@mono/utils-common';
import { Context } from './types';
import { Table, toGlobalId } from '@mono/utils-server';
import { animalParent, plantParent } from './validations';
import { TypeOf } from 'io-ts/Decoder';

const resolveByTypename = {
  __resolveType: ({ __typename }: { __typename: string }) => __typename,
};

type LivingThingNodeType = (BackendAnimalType | BackendPlantType) & {
  __typename: string;
  id: string;
};

const resolveNode = async (
  { table, id, serialized }: IDType,
  context: Context
): Promise<LivingThingNodeType> =>
  table === Table.Animal
    ? {
        __typename: 'Animal',
        id: serialized,
        ...(await context.animal.get(id)),
      }
    : {
        __typename: 'Plant',
        id: serialized,
        ...(await context.plant.get(id)),
      };

type BackendAnimalType = TypeOf<typeof BackendAnimal>;

const animalField = (name: keyof BackendAnimalType) => async (
  parent: unknown,
  _: unknown,
  context: Context
): Promise<BackendAnimalType[keyof BackendAnimalType]> => {
  const res = await parse(animalParent, parent);

  if (!res.success) throw res.errors;

  return (await context.animal.get(res.data.id.id))[name];
};

type BackendPlantType = TypeOf<typeof BackendPlant>;

const plantField = (name: keyof BackendPlantType) => async (
  parent: unknown,
  _: unknown,
  context: Context
): Promise<BackendPlantType[keyof BackendPlantType]> => {
  const res = await parse(plantParent, parent);

  if (!res.success) throw res.errors;

  return (await context.plant.get(res.data.id.id))[name];
};

export const resolvers = {
  Query: {
    livingThing: async (
      _: any,
      args: unknown,
      context: Context
    ): Promise<
      | InputError
      | ({ __typename?: 'LivingThingPayload' } & {
          node: BackendPlantType | BackendAnimalType;
        })
    > => {
      const parsed = await parse(LivingThingArgs, args);

      if (!parsed.success)
        return {
          __typename: 'InputError',
          errors: prepareErrorsForTransit(parsed.errors),
        };

      return {
        __typename: 'LivingThingPayload',
        node: await resolveNode(parsed.data.id, context),
      };
    },
  },
  Mutation: {
    addLivingThing: async (_: any, args: unknown, context: Context) => {
      const parsed = await parse(AddLivingThingArgs, args);

      if (!parsed.success)
        return {
          __typename: 'InputError',
          errors: prepareErrorsForTransit(parsed.errors),
        } as InputError;

      const {
        livingThing: { __typename },
      } = parsed.data.input;
      const { livingThing: input } = parsed.data.input;
      const id =
        input.__typename === 'Animal'
          ? {
              id: await context.animal.create(input),
              table: Table.Animal,
            }
          : {
              id: await context.plant.create(input),
              table: Table.Plant,
            };

      const globalId = toGlobalId(id);

      if (input.__typename === 'Animal')
        await context.diet.set(globalId, {
          diet: input.diet,
          eatenBy: input.eatenBy,
        });

      if (input.__typename === 'Plant')
        await context.diet.set(globalId, {
          diet: [],
          eatenBy: input.eatenBy,
        });

      return {
        __typename: 'AddLivingThingPayload',
        node: {
          __typename,
          id: globalId,
        },
      };
    },
    updateLivingThing: async (_: any, args: unknown, context: Context) => {
      const res = await parse(UpdateLivingThingArgs, args);

      if (!res.success)
        return {
          __typename: 'InputError',
          errors: prepareErrorsForTransit(res.errors),
        } as InputError;

      const { id, patch } = res.data.input;

      const table = id.table === Table.Animal ? context.animal : context.plant;
      const updated = await table.update(id.id, patch);

      if (patch.__typename === 'Animal')
        await context.diet.update(id.serialized, {
          diet: patch.diet,
          eatenBy: patch.eatenBy,
        });

      if (patch.__typename === 'Plant')
        await context.diet.update(id.serialized, {
          eatenBy: patch.eatenBy,
        });

      return {
        __typename: 'UpdateLivingThingPayload',
        node: { __typename: patch.__typename, id: id.serialized, ...updated },
      };
    },
    deleteLivingThing: async (
      _: any,
      args: unknown,
      context: Context
    ): Promise<InputError | DeleteLivingThingPayload> => {
      const res = await parse(DeleteLivingThingArgs, args);

      if (!res.success)
        return {
          __typename: 'InputError',
          errors: prepareErrorsForTransit(res.errors),
        } as InputError;

      const { id } = res.data.input;

      const table = id.table === Table.Animal ? context.animal : context.plant;

      const { deleted } = await table.delete(id.id);

      return {
        __typename: 'DeleteLivingThingPayload',
        deleted,
      };
    },
  },
  Node: resolveByTypename,
  AddLivingThingResult: resolveByTypename,
  UpdateLivingThingResult: resolveByTypename,
  DeleteLivingThingResult: resolveByTypename,
  LivingThing: resolveByTypename,
  LivingThingResult: resolveByTypename,
  AllLivingThingsResult: resolveByTypename,
  Plant: {
    name: plantField('name'),
    lifespan: plantField('lifespan'),
    weight: plantField('weight'),
    lifecycle: plantField('lifecycle'),
    eatenBy: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(plantParent, parent);

      if (!res.success) throw res.errors;

      return (await context.diet.get(res.data.id.serialized)).eatenBy.map(
        id => ({
          __typename: 'Animal',
          id,
        })
      );
    },
  },
  Animal: {
    name: animalField('name'),
    lifespan: animalField('lifespan'),
    weight: animalField('weight'),
    eatenBy: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(animalParent, parent);

      if (!res.success) throw res.errors;

      return (await context.diet.get(res.data.id.serialized)).eatenBy.map(
        id => ({
          __typename: 'Animal',
          id,
        })
      );
    },
    diet: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(animalParent, parent);

      if (!res.success) throw res.errors;

      const { diet } = await context.diet.get(res.data.id.serialized);
      const parsedIds = diet.map(async el => {
        const parsedId = await parse(id, el);
        return parsedId.success
          ? Promise.resolve(parsedId.data)
          : Promise.reject(parsedId.errors);
      });

      return (await Promise.all(parsedIds)).map(({ table, serialized }) => ({
        __typename: table === Table.Animal ? 'Animal' : 'Plant',
        id: serialized,
      }));
    },
  },
};
