import execa = require('execa');
import { Context } from 'semantic-release';
import { Docker } from './lib/docker';
import { IPluginConfig } from './lib/plugin-config';

export async function prepare(pluginConfig: IPluginConfig, context: Context) {
  const image = new Docker(pluginConfig, context);
  await image.buildImage();
}
