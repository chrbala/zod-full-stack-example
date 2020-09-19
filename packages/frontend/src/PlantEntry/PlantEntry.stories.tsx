import React from 'react';

import { PlantEntry } from './PlantEntry';
import { action } from '@storybook/addon-actions';

export default {
  title: 'PlantEntry',
  component: PlantEntry,
};

const validate = async () => ({
  name: 'name_error',
  weight: 'weight_error',
  lifespan: 'lifespan_error',
  lifecycle: 'lifecycle_error',
});

export const Base = () => (
  <PlantEntry
    initialValue={null}
    onSubmit={action('submit')}
    validate={validate}
  />
);
