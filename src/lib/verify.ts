import * as execa from 'execa';
import { Context } from 'semantic-release';
import { IPluginConfig } from '../plugin-config';
import SemanticError = require('@semantic-release/error');

export async function verifyConditions(
  pluginConfig: IPluginConfig,
  context: Context,
) {
  if (!pluginConfig.login) {
    context.logger.log('Skipping login due to config');
  }

  const USERNAME = context.env.DOCKER_USERNAME;
  const PASSWORD = context.env.DOCKER_PASSWORD;

  if (!USERNAME || !PASSWORD) {
    throw new SemanticError(
      'DOCKER_USERNAME and DOCKER_PASSWORD environment variables must be set',
    );
  }

  const passwd = execa('echo', [PASSWORD]);
  const login = execa('docker', [
    'login',
    pluginConfig.registryUrl || '',
    '-u',
    USERNAME,
    '--password-stdin',
  ]);

  passwd.stdout.pipe(login.stdin);

  try {
    await login;
  } catch (err) {
    context.logger.error(err);
    throw new SemanticError(
      'Docker authentication failed',
      'EAUTH',
      `Authentication to ${pluginConfig.registryUrl || 'dockerhub'} failed`,
    );
  }

  context.logger.log('Docker authentication successful');
}
