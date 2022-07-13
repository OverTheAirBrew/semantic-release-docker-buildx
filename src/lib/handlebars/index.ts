import { noConflict } from 'handlebars';
const handlebars = noConflict();

export function template(input: string) {
  if (typeof input !== 'string') {
    return () => {
      return input;
    };
  }

  return handlebars.compile(input);
}
