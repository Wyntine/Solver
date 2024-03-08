import { promisify } from "util";

export function copy<Obj>(object: Obj): Obj {
  return Object.assign({}, object);
}

export const wait = promisify(setTimeout);
