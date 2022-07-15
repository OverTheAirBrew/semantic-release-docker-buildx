import execa = require('execa');

/**
 * @description Wrapper around execa for testing purposes
 */
export function exec(
  file: string,
  args?: readonly string[],
  options?: execa.Options<string>,
): execa.ExecaChildProcess<string> {
  return execa(file, args, options);
}
