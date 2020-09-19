import React from 'react';

import { PlantEditor } from './PlantEditor';
import { action } from '@storybook/addon-actions';

export default {
  title: 'PlantEditor',
  component: PlantEditor,
};

export const Base = () => (
  <PlantEditor initialValue={null} onSubmit={action('submit')} />
);
