export interface IPluginConfig {
  name: string;

  registryUrl?: string;
  login?: boolean;

  platforms: string[];
  dockerFile?: string;

  buildArgs?: Record<string, string>;
  tags?: string[];

  cwd?: string;
}
