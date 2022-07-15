import { Context } from 'semantic-release';
import { parse } from 'semver';
import { IPluginConfig } from './plugin-config';

export async function buildTemplateVars(
  config: IPluginConfig,
  context: Context,
) {
  const { nextRelease, lastRelease } = context;

  const versions = {
    next: parse(nextRelease.version),
    previous: parse(lastRelease.version),
  };

  return {
    ...versions.next,
    ...versions,
    now: new Date().toISOString(),
  };
}
