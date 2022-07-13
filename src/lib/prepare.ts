import execa = require('execa');
import { Context } from 'semantic-release';
import { IPluginConfig } from '../plugin-config';

export async function prepare(pluginConfig: IPluginConfig, context: Context) {
  const stream = execa('docker', [
    'buildx',
    'create',
    '--name',
    'dockerx-builder',
    '--user',
  ]);

  stream.stderr.pipe(process.stderr);
  stream.stdout.pipe(process.stdout);

  await stream;
}
