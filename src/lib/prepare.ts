import execa = require('execa');
import { Context } from 'semantic-release';
import { IPluginConfig } from '../plugin-config';
import { buildTemplateVars } from './build-template-vars';
import { template } from './handlebars';

export async function prepare(pluginConfig: IPluginConfig, context: Context) {
  const builderName = pluginConfig.builderName || 'dockerx-builder';

  await setupBuilder(context, builderName);
  await buildPublishDockerX(pluginConfig, context);
  await cleanupDockerBuilder(context, builderName);
}

async function cleanupDockerBuilder(context: Context, builderName: string) {
  context.logger.log('Cleaning up Docker builder');

  const { stdout } = await execa('docker', ['buildx', 'ls']);
  if (stdout.indexOf(builderName) === -1) return;
  await execa('docker', ['buildx', 'rm', builderName]);

  context.logger.log('Docker builder cleaned up');
}

async function buildPublishDockerX(
  pluginConfig: IPluginConfig,
  context: Context,
) {
  context.logger.log('Building Docker image');

  const cwd = pluginConfig.cwd || process.cwd();
  const buildArgs = await buildDockerArgs(pluginConfig, context);

  const stream = execa('docker', buildArgs, { cwd });

  stream.stdout.pipe(process.stdout);
  stream.stderr.pipe(process.stderr);

  await stream;

  context.logger.log('Docker image built');
}

async function setupBuilder(context: Context, builderName: string) {
  context.logger.log('Setting up Docker builder');

  const stream = execa('docker', [
    'buildx',
    'create',
    '--name',
    builderName,
    '--use',
  ]);

  stream.stderr.pipe(process.stderr);
  stream.stdout.pipe(process.stdout);

  await stream;

  context.logger.log('Docker builder setup complete');
}

async function buildDockerArgs(pluginConfig: IPluginConfig, context: Context) {
  const buildArgParams = [];

  Object.entries(pluginConfig.buildArgs || {}).forEach(([key, value]) => {
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

    const imageName = pluginConfig.dockerProject
      ? `${pluginConfig.dockerProject}/${pluginConfig.dockerImage}`
      : pluginConfig.dockerImage;

    const version = template(tag)(templateVars);

    mappedTags.push(`${imageName}:${version}`);
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
