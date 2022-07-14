import execa = require('execa');

export async function cleanup() {
  const { stdout } = await execa('docker', ['buildx', 'ls']);

  if (stdout.indexOf('dockerx-builder') === -1) return;

  await execa('docker', ['buildx', 'rm', 'dockerx-builder']);
}

Promise.resolve()
  .then(async () => {
    await cleanup();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
