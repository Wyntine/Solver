import { Position } from "../types";
import { Axis } from "./axis";
import { Cell } from "./cell";
import { Logger } from "./logger";
import { Wall } from "./wall";

export class Point extends Axis {
  // private logger = new Logger("Point");

  constructor({ x, y }: Position) {
    const logger = new Logger("Point");

    super({ x, y, logger });
  }

  public isCell(): this is Cell {
    return false;
  }

  public isPoint(): this is Point {
    return true;
  }

  public isWall(): this is Wall {
    return false;
  }
}
