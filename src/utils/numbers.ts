export function isOdd(number: number): boolean {
  return number % 2 === 0;
}

export function isNaturalInteger(input: unknown): boolean {
  return typeof input === "number" && Number.isInteger(input) && input >= 0;
}

export function lengthArray(array: unknown[]): number[] {
  return new Array(array.length).fill("").map((_, index) => index + 1);
}
