import { Bobba } from '@bobba/core';

(async () => {
  console.log('Bobba is starting...');

  const bobba = Bobba.getInstance();
  await bobba.init();

  console.log('Bobba is ready!');
})();
