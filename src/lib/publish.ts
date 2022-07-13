import execa = require('execa');
import { Context } from 'semantic-release';
import { IPluginConfig } from '../plugin-config';
import { buildTemplateVars } from './build-template-vars';

import { template } from './handlebars';

require('source-map-support/register');

export async function publish(pluginConfig: IPluginConfig, context: Context) {
  context.logger.log(
    `Pushing version ${pluginConfig.name}:${context.nextRelease.version} to docker hub`,
  );

  const cwd = pluginConfig.cwd || process.cwd();

  const buildArgs = await buildDockerArgs(pluginConfig, context);

  const stream = execa('docker', buildArgs, { cwd });

  stream.stdout.pipe(process.stdout);
  stream.stderr.pipe(process.stderr);

  await stream;
}

async function buildDockerArgs(pluginConfig: IPluginConfig, context: Context) {
  const buildArgParams = [];

  Object.entries(pluginConfig.buildArgs).forEach(([key, value]) => {
    buildArgParams.push(`--build-arg`);
    buildArgParams.push(`${key}=${value}`);
  });

  const platforms = pluginConfig.platforms.join(',');

  const tags = pluginConfig.tags?.length
    ? pluginConfig.tags
    : ['latest', '{{major}}-latest', '{{version}}'];

  const templateVars = await buildTemplateVars(pluginConfig, context);

  const mappedTags: string[] = [];

  tags.forEach((tag) => {
    mappedTags.push('--tag');
    mappedTags.push(template(tag)(templateVars));
  });

  const params = ['buildx', 'build'];

  if (pluginConfig.dockerFile) params.push(`-f ${pluginConfig.dockerFile}`);

  params.push(
    ...buildArgParams,
    ...mappedTags,
    `--platform=${platforms}`,
    '--push',
    '.',
  );

  return params;
}
