import { WallOptions } from "../types";
import { Axis } from "./axis";
import { Cell } from "./cell";
import { Logger } from "./logger";
import { Point } from "./point";

export class Wall extends Axis {
  private border?: boolean;
  private groupBorder?: boolean;

  // private logger: Logger;

  constructor({ x, y, border, groupBorder }: WallOptions) {
    const logger = new Logger("Wall");

    super({ x, y, logger });

    if (border !== undefined) this.border = border;
    if (groupBorder !== undefined) this.groupBorder = groupBorder;
    // this.logger = logger;
  }

  public isBorder(): boolean {
    return this.border ?? false;
  }

  public isGroupBorder(): boolean {
    return this.groupBorder ?? false;
  }

  public setGroupBorder(isGroupBorder: boolean): this {
    this.groupBorder = isGroupBorder;
    return this;
  }

  public isCell(): this is Cell {
    return false;
  }

  public isPoint(): this is Point {
    return false;
  }

  public isWall(): this is Wall {
    return true;
  }
}
