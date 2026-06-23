import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'players',
      columns: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'age',
          type: 'number',
        },
      ],
    }),
  ],
});