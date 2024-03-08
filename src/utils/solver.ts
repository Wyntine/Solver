import { UUID } from "crypto";
import { Position } from "../types";
import { Cell } from "../classes/cell";

export function convertFromCellCoordinates(cellPosition: Position): Position {
  return {
    x: cellPosition.x * 2 + 1,
    y: cellPosition.y * 2 + 1,
  };
}

export function convertToCellCoordinates(coordinates: Position): Position {
  return {
    x: (coordinates.x - 1) / 2,
    y: (coordinates.y - 1) / 2,
  };
}

export function coordinateString({ x, y }: Position): string {
  return `(x: ${x}, y: ${y})`;
}

export function getPositionCombinations(
  { x, y }: Position,
  offset = 1
): Position[] {
  return [
    { x: x + offset, y },
    { x: x - offset, y },
    { x, y: y + offset },
    { x, y: y - offset },
  ];
}

export function comparePositions(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function filterGroups(cells: Cell[]): Record<UUID, Cell[]> {
  const cellGroups: Record<UUID, Cell[]> = {};

  for (const cell of cells) {
    const groupId = cell.getGroupId();

    if (!groupId) continue;

    cellGroups[groupId] = [...(cellGroups[groupId] ?? []), cell];
  }

  return cellGroups;
}
