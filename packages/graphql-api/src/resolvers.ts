import {
  LivingThingPayload,
  Animal,
  Plant,
  InputError,
} from '@mono/resolver-typedefs';
import { LivingThingArgs, AddLivingThingArgs } from '@mono/validations-api';
import { parse, prepareErrorsForTransit } from '@mono/utils-common';
import { Context } from './types';
import { Table, toGlobalId, DeserializedGlobalId } from '@mono/utils-server';
import { animalParent, plantParent } from './validations';

const resolveByTypename = {
  __resolveType: ({ __typename }: { __typename: string }) => __typename,
};

const resolveNode = async (
  { table, id }: DeserializedGlobalId,
  context: Context
): Promise<Animal | Plant> =>
  table === Table.Animal
    ? {
        __typename: 'Animal',
        id: toGlobalId({ table: Table.Animal, id: id }),
        ...(await context.animal.get(id)),
      }
    : {
        __typename: 'Plant',
        id: toGlobalId({ table: Table.Plant, id: id }),
        ...(await context.plant.get(id)),
      };

const animalField = (name: string) => async (
  parent: unknown,
  _: unknown,
  context: Context
): Promise<string> => {
  const res = await parse(animalParent, parent);

  if (!res.success) throw res.errors;

  return (await context.animal.get(res.data.id.id))[name];
};

const plantField = (name: string) => async (
  parent: unknown,
  _: unknown,
  context: Context
): Promise<string> => {
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
      InputError | (LivingThingPayload & { node: Animal | Plant })
    > => {
      const parsed = await parse(LivingThingArgs, args);

      if (!parsed.success) {
        return {
          __typename: 'InputError',
          errors: prepareErrorsForTransit(parsed.errors),
        };
      }

      return {
        __typename: 'LivingThingPayload',
        node: await resolveNode(parsed.data.id, context),
      };
    },
  },
  Mutation: {
    addLivingThing: async (_: any, args: any, context: Context) => {
      const parsed = await parse(AddLivingThingArgs, args);

      if (!parsed.success) {
        const res = {
          __typename: 'InputError',
          errors: prepareErrorsForTransit(parsed.errors),
        } as InputError;

        console.log(JSON.stringify(parsed.errors, null, 2));

        return res;
      }

      const {
        livingThing: { __typename, ...livingThing },
      } = parsed.data.input;
      const { livingThing: input } = parsed.data.input;
      const id =
        input.__typename === 'Animal'
          ? {
              id: await context.animal.create({
                name: input.name,
                lifespan: input.lifespan,
                weight: input.weight,
              }),
              table: Table.Animal,
            }
          : {
              id: await context.plant.create({
                name: input.name,
                lifespan: input.lifespan,
                weight: input.weight,
                lifecycle: input.lifecycle,
              }),
              table: Table.Plant,
            };

      const globalId = toGlobalId(id);

      if (input.__typename === 'Animal') {
        await context.diet.set(globalId, {
          diet: input.diet,
          eatenBy: input.eatenBy,
        });
      }

      if (input.__typename === 'Plant') {
        await context.diet.set(globalId, {
          diet: [],
          eatenBy: input.eatenBy,
        });
      }

      return {
        __typename: 'AddLivingThingPayload',
        node: {
          __typename,
          id: globalId,
        },
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

      return (
        await context.diet.get(toGlobalId(res.data.id))
      ).eatenBy.map(id => ({ __typename: 'Animal', id }));
    },
  },
  Animal: {
    name: animalField('name'),
    lifespan: animalField('lifespan'),
    weight: animalField('weight'),
    eatenBy: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(animalParent, parent);

      if (!res.success) throw res.errors;

      return (await context.diet.get(toGlobalId(res.data.id))).eatenBy.map(
        id => ({
          __typename: 'Animal',
          id,
        })
      );
    },
    diet: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(animalParent, parent);

      if (!res.success) throw res.errors;

      return (await context.diet.get(toGlobalId(res.data.id))).diet.map(id => ({
        __typename: res.data.id.table === Table.Animal ? 'Animal' : 'Plant',
        id,
      }));
    },
  },
};
