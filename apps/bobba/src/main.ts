import { Bobba } from '@bobba/core';
import { Room } from '@bobba/room';

(async () => {
  console.log('Bobba is starting...');

  const bobba = Bobba.getInstance();
  await bobba.init();

  await bobba.load();

  //   const tileMap = `
  //     xxxxxxxxxxxxxxxxxxxxxxxxx
  //     xxxxxxxxxxx33333333333333
  //     xxxxxxxxxxx33333333333333
  //     xxxxxxxxxxx33333333333333
  //     xxxxxxxxxxx33333333333333
  //     xxxxxxxxxxx33333333333333
  //     xxxxxxxxxxx33333333333333
  //     xxxxxxx333333333333333333
  //     xxxxxxx333333333333333333
  //     xxxxxxx333333333333333333
  //     xxxxxxx333333333333333333
  //     xxxxxxx333333333333333333
  //     xxxxxxx333333333333333333
  //     x4444433333xxxxxxxxxxxxxx
  //     x4444433333xxxxxxxxxxxxxx
  //     x44444333333222xx000000xx
  //     x44444333333222xx000000xx
  //     xxx44xxxxxxxx22xx000000xx
  //     xxx33xxxxxxxx11xx000000xx
  //     xxx33322222211110000000xx
  //     xxx33322222211110000000xx
  //     xxxxxxxxxxxxxxxxx000000xx
  //     xxxxxxxxxxxxxxxxx000000xx
  //     xxxxxxxxxxxxxxxxx000000xx
  //     xxxxxxxxxxxxxxxxx000000xx
  //     xxxxxxxxxxxxxxxxxxxxxxxxx
  // `;

  const tileMap = `
  xxxxxxxxxx
  x000000000
  0000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  x000000000
  `;

  // const tileMap = `
  //  xxxxx
  //  x0000
  //  x0000
  //  x0000
  //  `;

  const room = new Room({
    bobba,
    tileMap,
  });

  await room.render();

  console.log('Bobba is ready!');
})();
