import { UUID } from "crypto";
import { Cell } from "./classes/cell";
import { Logger } from "./classes/logger";
import { Point } from "./classes/point";
import { Wall } from "./classes/wall";
import { Backup } from "./classes/backup";

export interface SolverOptions {
  columns: number;
  lines: number;
}

export interface TableOptions {
  columns: number;
  lines: number;
}

export interface StringRecord {
  [Key: string]: string | StringRecord;
}

export interface Position {
  x: number;
  y: number;
}

export interface AxisOptions extends Position {
  logger: Logger;
}

export interface WallOptions extends Position {
  border?: boolean;
  groupBorder?: boolean;
}

export interface CellOptions extends Position {
  value?: number;
}

export type TableItem = Wall | Cell | Point;
export type TableData = TableItem[][];

export interface CellWalls {
  up: Wall;
  down: Wall;
  right: Wall;
  left: Wall;
}

export interface AvailableCells {
  up: Cell;
  down: Cell;
  right: Cell;
  left: Cell;
}

export type Directions = "up" | "down" | "right" | "left";

export interface ReloadGroupOptions {
  backup?: Backup;
  lastAttempts?: number;
}

export interface BackupData {
  position: Position;
  value: number | undefined;
  possibleValues: number[];
  groupId: UUID | undefined;
}
