import { Context } from 'semantic-release';
import { Docker } from './lib/docker';
import { IPluginConfig } from './lib/plugin-config';

export async function verifyConditions(
  pluginConfig: IPluginConfig,
  context: Context,
) {
  const docker = new Docker(pluginConfig, context);
  await docker.login();

  await docker.checkDockerFileExists();
}
