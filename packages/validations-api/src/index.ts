import * as z from 'zod';
import * as common from '@mono/validations-common';
import { fromGlobalId, Table, toGlobalId } from '@mono/utils-server';

export const serializedID = common.ID.refine(
  id => !(fromGlobalId(id) instanceof Error),
  'invalid'
);

export const globalIDType = z.object({
  table: z.union([z.literal(Table.Plant), z.literal(Table.Animal)]),
  id: z.number(),
});

const globalID = z.transformer(serializedID, globalIDType, id => {
  const res = fromGlobalId(id);
  if (res instanceof Error) throw res;

  return res;
});

export const animalID = globalID.refine(
  ({ table }) => table === Table.Animal,
  'not_animal'
);

export const plantID = globalID.refine(
  ({ table }) => table === Table.Plant,
  'not_plant'
);

export const livingThingID = z.union([animalID, plantID]);

export const LivingThingCommon = z.object({
  name: common.name,
  lifespan: z.number(),
  eatenBy: z.array(animalID),
  weight: z.number(),
});

export const AnimalInput = LivingThingCommon.extend({
  diet: z.array(livingThingID),
});

export const BackendAnimal = AnimalInput.omit({
  eatenBy: true,
  diet: true,
});

export const PlantInput = LivingThingCommon.extend({
  lifecycle: common.lifecycle,
});

export const BackendPlant = PlantInput.omit({
  eatenBy: true,
  diet: true,
});

export const LivingThingPatchCommon = z.object({
  name: common.name,
  lifespan: z.number(),
  eatenBy: z.array(animalID),
  weight: z.number(),
});

export const AnimalPatchInput = LivingThingCommon.extend({
  diet: z.array(livingThingID),
});

export const PlantPatchInput = LivingThingCommon.extend({
  lifecycle: common.lifecycle,
});

export const LivingThingPatchInput = z.object({
  animal: AnimalInput,
  plant: PlantInput,
});

export const UpdateLivingThingInput = z.object({
  id: livingThingID,
  patch: LivingThingPatchInput,
});

export const UpdateLivingThingArgs = z.object({
  input: UpdateLivingThingInput,
});

export const DeleteLivingThingInput = z.object({
  id: livingThingID,
});

export const DeleteLivingThingArgs = z.object({
  input: DeleteLivingThingInput,
});

export const NodeArgs = z.object({
  id: globalID,
});

export const AllLivingThingsInput = z.object({
  page: z.number(),
});

export const AllLivingThingsArgs = z.object({
  input: AllLivingThingsInput,
});

export const LivingThingArgs = z.object({
  id: livingThingID,
});

const throws = () => {
  throw new Error('invalid');
};

export const LivingThingInput = z.transformer(
  z
    .object({
      animal: AnimalInput.optional(),
      plant: PlantInput.optional(),
    })
    .refine(
      ({ plant, animal }) => [plant, animal].filter(Boolean).length === 1,
      'invalid_count'
    ),
  z.union([
    PlantInput.extend({
      __typename: z.literal('Plant'),
    }),
    AnimalInput.extend({
      __typename: z.literal('Animal'),
    }),
  ]),
  ({ plant, animal }) =>
    plant
      ? { __typename: 'Plant' as 'Plant', ...plant }
      : animal
      ? { __typename: 'Animal' as 'Animal', ...animal }
      : throws()
);

export const AddLivingThingInput = z.object({
  livingThing: LivingThingInput,
});

export const AddLivingThingArgs = z.object({
  input: AddLivingThingInput,
});
