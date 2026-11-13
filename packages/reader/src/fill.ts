/** A UI string with its `{name}` slots filled, such as "{n}人" with { n: 3 }. */
export const fill = (text: string, vars: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k]));
