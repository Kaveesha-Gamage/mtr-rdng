import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Player extends Model {
  static table = 'players';

  // Explicitly initialize with fallback values to satisfy the compiler
  @field('name') name = ''; 
  @field('age') age = 0;
}