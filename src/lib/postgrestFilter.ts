/**
 * Escaping for values interpolated into PostgREST filter expressions.
 *
 * `.or()` takes a string in PostgREST's own filter grammar, where conditions are
 * separated by commas and grouped with parentheses:
 *
 *   or=(title.ilike.%term%,description.ilike.%term%)
 *
 * Interpolating a raw user string into that grammar lets the user's punctuation
 * be read as syntax. A search for "Acme, Inc" produced
 *
 *   (title.ilike.%Acme, Inc%,description.ilike.%Acme, Inc%)
 *
 * which PostgREST splits on every top-level comma, leaving ` Inc%` as a
 * condition it cannot parse - so any search containing a comma failed outright.
 * A deliberately chosen value does worse: "x,trust_score.gte.0" injects
 * `trust_score.gte.0` as an additional OR branch, which is true of every row, so
 * the search stops filtering and returns everything the other conditions allow.
 *
 * PostgREST permits a value to be wrapped in double quotes, which makes the
 * reserved characters , . : ( ) ordinary text. Inside the quotes a backslash and
 * a double quote have to be escaped.
 *
 * Note this deliberately does not touch % or _ . Those are LIKE wildcards rather
 * than PostgREST syntax: they change which rows match, but they cannot restructure
 * the filter, and a search box that honours a wildcard is a reasonable thing.
 */
export function pgrestQuote(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * A quoted `%value%` pattern for a substring ilike.
 */
export function pgrestContains(value: string): string {
  return pgrestQuote(`%${value}%`);
}
