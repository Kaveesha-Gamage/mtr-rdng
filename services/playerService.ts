import { database } from '../database/database';

// insert data into database
export const seedPlayers = async () => {
  const playersCollection = database.get('players');

  // All batch creations must stay inside a single database.write block
  await database.write(async () => {
    
    await playersCollection.create((player: any) => {
      player.name = 'Virat Kohli';
      player.age = 36;
    });

    await playersCollection.create((player: any) => {
      player.name = 'AB de Villiers';
      player.age = 42;
    });

    await playersCollection.create((player: any) => {
      player.name = 'Joe Root';
      player.age = 35;
    });

    await playersCollection.create((player: any) => {
      player.name = 'Steve Smith';
      player.age = 36;
    });

    await playersCollection.create((player: any) => {
      player.name = 'Kane Williamson';
      player.age = 35;
    });
    
  });
};

//retrive data from database

export const getPlayers = async () => {
  const playersCollection = database.get('players');
  const players = await playersCollection.query().fetch();
  return players;
};