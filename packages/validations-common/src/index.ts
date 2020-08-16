import * as z from 'zod';
import { PlantLifecycle } from '@mono/resolver-typedefs';

export const ID = z.string();

export const name = z.string();
export const lifespan = z.number();

export const lifecycle = z.union([
  z.literal(PlantLifecycle.Deciduous),
  z.literal(PlantLifecycle.Evergreen),
  z.literal(PlantLifecycle.SemiDeciduous),
]);
