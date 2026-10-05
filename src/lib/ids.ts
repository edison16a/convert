/** A short unique id for a queue row. Not a secret, just a stable React key. */
export function newId(): string {
  return crypto.randomUUID();
}
