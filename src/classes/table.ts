import { UUID } from "crypto";
import {
  CellWalls,
  AvailableCells,
  Position,
  TableData,
  TableItem,
  TableOptions,
} from "../types";
import { inputChecker } from "../utils/inputChecker";
import { isOdd } from "../utils/numbers";
import {
  convertFromCellCoordinates,
  convertToCellCoordinates,
  coordinateString,
  filterGroups,
  getPositionCombinations,
} from "../utils/solver";
import { Cell } from "./cell";
import { Logger } from "./logger";
import { Messages } from "./messages";
import { Point } from "./point";
import { Wall } from "./wall";
import chalk from "chalk";

export class Table {
  private data: TableData = [];
  private columns: number;
  private lines: number;

  private logger = new Logger("Table");
  private messages = new Messages("table");

  constructor({ columns, lines }: TableOptions) {
    inputChecker(
      [
        [columns, "invalidColumns"],
        [lines, "invalidLines"],
      ],
      this.logger,
      this.messages,
      (input) => this.lengthCheck(input)
    );

    this.columns = columns;
    this.lines = lines;
    this.prepare();
  }

  public getX(x: number) {
    return x;
  }

  public getY(y: number) {
    return this.getLineLength() - 1 - y;
  }

  public getItem({ x, y }: Position): TableItem {
    const coorString = coordinateString({ x, y });
    const item = this.data.at(this.getY(y))?.at(this.getX(x));

    if (!item) {
      throw this.logger.createError(
        this.messages.getErrorMessage("notFound"),
        coorString
      );
    }

    return item;
  }

  public get(): TableData {
    return this.data;
  }

  public getCells(): Cell[] {
    return this.data
      .flatMap((item) => item)
      .filter((item) => item.isCell()) as Cell[];
  }

  public getCellGroup(groupId: UUID): Cell[] {
    return this.getCells().filter((cell) => cell.getGroupId() === groupId);
  }

  public getGroups(): Record<UUID, Cell[]> {
    const cells = this.getCells();
    return filterGroups(cells);
  }

  public logGroups(): void {
    const groups = Object.values(this.getGroups());

    for (const group of groups) {
      console.log("-".repeat(30));
      console.log(group);
    }
  }

  public logCellsCompact(): void {
    const groups = Object.values(this.getGroups());

    for (const group of groups) {
      console.log(
        "-".repeat(5) + group.at(0)?.getGroupId(true) + "-".repeat(5)
      );
      console.log(
        group
          .map((cell) => {
            const { x, y } = cell.getPosition();
            const value = cell.getValue();
            const possibleValues = cell.getPossibleValues();
            return `x: ${x}, y: ${y} | value: ${value} | pValues: ${possibleValues.join(", ")}`;
          })
          .join("\n")
      );
    }
  }

  public print(): string {
    return this.data
      .map((line, lineIndex) =>
        line
          .map((column) =>
            column instanceof Point
              ? (() => {
                  const walls = getPositionCombinations(column.getPosition())
                    .filter((position) => !this.isObjectOutOfTable(position))
                    .map((position) => this.getItem(position))
                    .filter((item) => item.isWall()) as Wall[];

                  const nonBorders = walls.filter(
                    (wall) => !wall.isGroupBorder() && !wall.isBorder()
                  );

                  return walls.length === nonBorders.length
                    ? chalk.dim.gray("■")
                    : chalk.blue("■");
                })()
              : column instanceof Wall
                ? isOdd(lineIndex)
                  ? column.isBorder() || column.isGroupBorder()
                    ? chalk.blue("═══")
                    : chalk.dim.gray("───")
                  : column.isBorder() || column.isGroupBorder()
                    ? chalk.blue("║")
                    : chalk.dim.gray("│")
                : chalk.redBright(
                    (() => {
                      const value = `${column.hasValue() ? column.getValue() : " "}`;
                      return value.length === 1
                        ? ` ${value} `
                        : value.length === 2
                          ? ` ${value}`
                          : value;
                    })()
                  )
          )
          .join("")
      )
      .join("\n");
  }

  public getColumnLength(): number {
    return this.columns * 2 + 1;
  }

  public getLineLength(): number {
    return this.lines * 2 + 1;
  }

  public checkBorder(columnIndex: number, lineIndex: number): boolean {
    return (
      columnIndex === 0 ||
      columnIndex === this.getColumnLength() - 1 ||
      lineIndex === 0 ||
      lineIndex === this.getLineLength() - 1
    );
  }

  public getAvailableCells(cellPosition: Position): Partial<AvailableCells> {
    const walls = this.getWalls(cellPosition);
    const final: Partial<AvailableCells> = {};

    for (const wallKey in walls) {
      const key = wallKey as keyof typeof walls;
      const wall = walls[key];

      if (wall.isBorder() || wall.isGroupBorder()) continue;

      const { x, y } = wall.getPosition();
      const xAdjustment = wallKey === "right" ? 1 : wallKey === "left" ? -1 : 0;
      const yAdjustment = wallKey === "up" ? 1 : wallKey === "down" ? -1 : 0;

      const lastPosition = {
        x: x + xAdjustment,
        y: y + yAdjustment,
      } satisfies Position;

      if (this.isObjectOutOfTable(lastPosition)) continue;

      const cell = this.getItem(lastPosition);

      if (!cell.isCell()) continue;

      final[key] = cell;
    }

    return final;
  }

  public getCell(cellPosition: Position): Cell {
    const coorString = coordinateString(cellPosition);

    if (this.isCellOutOfTable(cellPosition)) {
      throw this.logger.createError(
        this.messages.getErrorMessage("cellOutOfBounds"),
        coorString
      );
    }

    const { x, y } = convertFromCellCoordinates(cellPosition);
    const cell = this.getItem({ x, y });

    if (!(cell instanceof Cell)) {
      throw this.logger.createError(
        this.messages.getErrorMessage("notCell"),
        coorString
      );
    }

    return cell;
  }

  public getWalls(cellPosition: Position): CellWalls {
    if (this.isCellOutOfTable(cellPosition)) {
      throw this.logger.createError(
        this.messages.getErrorMessage("cellOutOfBounds"),
        coordinateString(cellPosition)
      );
    }

    const { x, y } = convertFromCellCoordinates(cellPosition);

    return {
      right: this.getWall({ x: x + 1, y }),
      left: this.getWall({ x: x - 1, y }),
      down: this.getWall({ x, y: y - 1 }),
      up: this.getWall({ x, y: y + 1 }),
    };
  }

  public getWall(coordinates: Position): Wall {
    const coorString = coordinateString(coordinates);
    if (this.isObjectOutOfTable(coordinates)) {
      throw this.logger.createError(
        this.messages.getErrorMessage("objectOutOfBounds"),
        coorString
      );
    }

    const wall = this.getItem(coordinates);

    if (!(wall instanceof Wall)) {
      throw this.logger.createError(
        this.messages.getErrorMessage("notWall"),
        coorString
      );
    }

    return wall;
  }

  public getNearbyCells(cellPosition: Position): Cell[] {
    const { x, y } = convertFromCellCoordinates(cellPosition);
    const cell = this.getItem({ x, y });

    if (!cell.isCell()) {
      throw this.logger.createError(
        this.messages.getErrorMessage("notCell"),
        coordinateString(cellPosition)
      );
    }

    const items = [
      { x: x + 2, y },
      { x: x - 2, y },
      { x: x + 2, y: y + 2 },
      { x: x + 2, y: y - 2 },
      { x: x - 2, y: y + 2 },
      { x: x - 2, y: y - 2 },
      { x, y: y + 2 },
      { x, y: y - 2 },
    ];

    return items
      .filter(
        (item) => !this.isObjectOutOfTable(item) && this.getItem(item).isCell()
      )
      .map((item) => this.getCell(convertToCellCoordinates(item)));
  }

  private lengthCheck(input: unknown): boolean {
    return typeof input === "number" && Number.isInteger(input) && input >= 3;
  }

  private prepare(): void {
    const lineLength = this.getLineLength();
    const newTable: TableData = new Array(lineLength)
      .fill("")
      .map((_, lineIndex) => {
        return new Array(this.getColumnLength())
          .fill("")
          .map((_, columnIndex) => {
            const isOnBorder = this.checkBorder(columnIndex, lineIndex);
            const coordinates = { x: columnIndex, y: lineIndex };
            const point = new Point(coordinates);
            const wall = isOnBorder
              ? new Wall({ ...coordinates, border: isOnBorder })
              : new Wall(coordinates);
            const cell = new Cell(coordinates);
            return isOdd(lineIndex)
              ? isOdd(columnIndex)
                ? point
                : wall
              : isOdd(columnIndex)
                ? wall
                : cell;
          });
      })
      .reverse();

    this.data = newTable;
  }

  private isObjectOutOfTable({ x, y }: Position): boolean {
    return (
      x > this.getColumnLength() - 1 ||
      x < 0 ||
      y > this.getLineLength() - 1 ||
      y < 0
    );
  }

  private isCellOutOfTable({ x, y }: Position): boolean {
    return x > this.columns - 1 || x < 0 || y > this.lines - 1 || y < 0;
  }
}
