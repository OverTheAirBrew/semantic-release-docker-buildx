import execa = require('execa');

export async function cleanup() {
  const { stdout } = await execa('docker', [
    'dockerx',
    'ls',
    '|',
    'grep',
    'dockerx-builder',
  ]);

  if (!stdout) return;

  await execa('docker', ['dockerx', 'rm', 'dockerx-builder']);
}
