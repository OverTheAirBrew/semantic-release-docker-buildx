import { Context } from 'semantic-release';

import { existsSync } from 'fs';
import { join } from 'path';
import { buildTemplateVars } from './build-template-vars';
import { template } from './handlebars';
import { IPluginConfig } from './plugin-config';
import SemanticError = require('@semantic-release/error');

import { exec } from './execa-wrapper';

export class Docker {
  private readonly builderName: string;
  private readonly cwd: string;
  private readonly dockerFile: string;
  private readonly shouldLogin: boolean;

  constructor(private pluginConfig: IPluginConfig, private context: Context) {
    this.builderName = pluginConfig.builderName || 'dockerx-builder';
    this.cwd = pluginConfig.cwd || process.cwd();
    this.dockerFile = pluginConfig.dockerFile || 'Dockerfile';
    this.shouldLogin = pluginConfig.login || true;
  }

  async buildImage() {
    await this.setupBuilder();

    const buildArgs = await this.buildDockerArgs(
      this.pluginConfig,
      this.context,
    );

    await this.runDockerCommand(buildArgs);
  }

  async publishImage() {
    const buildArgs = await this.buildDockerArgs(
      this.pluginConfig,
      this.context,
      true,
    );

    await this.runDockerCommand(buildArgs);
    await this.stopBuilder();
  }

  async setupBuilder() {
    this.context.logger.log('Setting up Docker builder');

    if (!(await this.checkBuilderRunning())) return;

    await this.runDockerCommand([
      'buildx',
      'create',
      '--name',
      this.builderName,
      '--use',
    ]);

    this.context.logger.log('Docker builder setup complete');
  }

  async stopBuilder() {
    if (!(await this.checkBuilderRunning())) return;
    await this.runDockerCommand(['buildx', 'rm', this.builderName]);
  }

  async login() {
    if (!this.shouldLogin) return;

    const { DOCKER_USERNAME, DOCKER_PASSWORD } = this.context.env;

    if (!DOCKER_USERNAME || !DOCKER_PASSWORD) {
      throw new SemanticError(
        'DOCKER_USERNAME and DOCKER_PASSWORD environment variables must be set',
      );
    }

    const passwd = exec('echo', [DOCKER_PASSWORD]);
    const login = exec('docker', [
      'login',
      this.pluginConfig.registryUrl || '',
      '-u',
      DOCKER_USERNAME,
      '--password-stdin',
    ]);

    passwd.stdout.pipe(login.stdin);

    try {
      await login;
      console.log('Logged in');
    } catch (err) {
      console.log(err);
      this.context.logger.error(err);
      throw new SemanticError(
        'Docker authentication failed',
        'EAUTH',
        `Authentication to ${
          this.pluginConfig.registryUrl || 'dockerhub'
        } failed`,
      );
    }

    this.context.logger.log('Docker authentication successful');
  }

  async checkDockerFileExists() {
    const dockerFilePath = join(this.cwd, this.dockerFile);
    if (existsSync(dockerFilePath)) return;

    throw new SemanticError(
      'Dockerfile not found',
      'EBUILD',
      `Dockerfile not found at ${dockerFilePath}`,
    );
  }

  private async checkBuilderRunning() {
    const { stdout } = await exec('docker', ['buildx', 'ls']);
    return stdout.indexOf(this.builderName) > -1;
  }

  private async runDockerCommand(params: string[]) {
    this.context.logger.log(
      'Running docker command with params',
      JSON.stringify(params),
    );

    const stream = exec('docker', params, { cwd: this.cwd });

    stream.stderr.pipe(process.stderr);
    stream.stdout.pipe(process.stdout);

    await stream;

    this.context.logger.log('Finished running docker command');
  }

  private async buildDockerArgs(
    pluginConfig: IPluginConfig,
    context: Context,
    push: boolean = false,
  ) {
    const buildArgParams = [];

    const templateVars = await buildTemplateVars(
      this.pluginConfig,
      this.context,
    );

    Object.entries(pluginConfig.buildArgs || {}).forEach(([key, value]) => {
      const mappedValue = template(value)(templateVars);
      buildArgParams.push(`--build-arg`);
      buildArgParams.push(`${key}=${mappedValue}`);
    });

    const platforms = pluginConfig.platforms.join(',');

    const tags = pluginConfig.tags?.length
      ? pluginConfig.tags
      : ['latest', '{{major}}-latest', '{{version}}'];

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

    if (pluginConfig.dockerFile)
      params.push(`-f`, `${pluginConfig.dockerFile}`);

    params.push(
      ...buildArgParams,
      ...mappedTags,
      `--platform=${platforms}`,
      push ? '--push' : undefined,
      '.',
    );

    return params.filter((p) => !!p);
  }
}
