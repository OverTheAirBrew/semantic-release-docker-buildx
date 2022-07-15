import { Context } from 'semantic-release';
import { Docker } from './lib/docker';
import { IPluginConfig } from './lib/plugin-config';

export async function failure(pluginConfig: IPluginConfig, context: Context) {
  const image = new Docker(pluginConfig, context);
  await image.stopBuilder();
}
