/* Small bits of wording every game uses. */

/** "1 move", "2 moves". */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
