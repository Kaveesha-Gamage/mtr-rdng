import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import Player from '../models/players';

const adapter = new SQLiteAdapter({
  schema,
});

export const database = new Database({
  adapter,
  modelClasses: [Player],
});

export const initDatabase = () => {
  return database; 
};

export const exportDatabase = async () => {
  console.log("Database export triggered");
};