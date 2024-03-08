import { randomUUID } from "crypto";
import {
  Directions,
  Position,
  // ReloadGroupOptions,
  SolverOptions,
} from "../types";
// import { Logger } from "./logger";
// import { Messages } from "./messages";
import { Table } from "./table";
import { lengthArray } from "../utils/numbers";
import { Backup } from "./backup";
import { filterGroups } from "../utils/solver";
import { getRandomItem } from "../utils/arrays";
import { wait } from "../utils/object";

export class Solver {
  private logEnabled = false;
  private waitTime = 0;

  public table: Table;

  // private logger = new Logger("Solver");
  // private messages = new Messages("solver");

  constructor({ columns, lines }: SolverOptions) {
    this.table = new Table({ columns, lines });
  }

  public enableLog(waitTime?: number): this {
    this.logEnabled = true;
    if (waitTime) this.waitTime = waitTime;
    return this;
  }

  public async solve() {
    this.setGroups();

    let lastAttempts = 0;
    const backup = new Backup();

    let totalSteps = 0;
    let firstBackup = false;
    let backupPending = false;
    const lastData = new Backup();
    const timeStart = Date.now();

    while (true as boolean) {
      const cells = this.table.getCells();
      this.log("-".repeat(50));
      const groups = Object.values(filterGroups(cells));

      lastData.setBackup(cells);

      for (const cells of groups) {
        for (const cell of cells) {
          const cellValue = cell.getValue();
          const nearbyCells = this.table.getNearbyCells(cell.getCellPosition());
          const allCells = cells
            .concat(...nearbyCells)
            .filter((cell, index, array) => array.indexOf(cell) === index);

          if (cellValue) {
            allCells.forEach((cell) => cell.removePossibleValues(cellValue));
            cell.resetPossibleValues();
            continue;
          }

          const deletedNumbers = allCells
            .map((cell) => cell.getValue())
            .filter((value) => value) as number[];
          const groupLengthArray = lengthArray(cells);
          const lastValues = groupLengthArray.filter(
            (number) => !deletedNumbers.includes(number)
          );
          cell.addPossibleValues(...lastValues);
        }
      }

      for (const cell of cells) {
        const groupCells = this.table
          .getCellGroup(cell.getGroupId(true))
          .filter((_, i, array) => array.indexOf(cell) !== i);
        const nearbyCells = this.table.getNearbyCells(cell.getCellPosition());
        const reachableCells = [...groupCells, ...nearbyCells];

        const onlyNumber =
          cell.getIfOnlyOnePossibleValueExists() ??
          cell
            .getPossibleValues()
            .filter(
              (number) =>
                !groupCells.find((cell) => cell.hasPossibleValue(number))
            )
            .at(0);
        const value = cell.getValue();

        if (value) {
          reachableCells.forEach((cell) => cell.removePossibleValues(value));
          continue;
        }

        if (onlyNumber) {
          reachableCells.forEach((cell) =>
            cell.removePossibleValues(onlyNumber)
          );
          cell.setValue(onlyNumber);
          cell.resetPossibleValues();
          continue;
        }
      }

      if (backupPending) {
        const emptyCells = cells.filter((cell) => !cell.hasValue());

        if (emptyCells.length) {
          let cellAttempts = 0;

          while (true as boolean) {
            if (cellAttempts >= 10) break;

            const emptyCell = getRandomItem(emptyCells);

            if (!emptyCell.getPossibleValues().length) {
              this.log("Hatalı girdi var.");
              cellAttempts++;
              continue;
            }

            emptyCell
              .setValue(getRandomItem(emptyCell.getPossibleValues()))
              .removePossibleValues();
            break;
          }
        } else {
          this.log("Boş hücre yok.");
        }

        backupPending = false;
      }

      let checkFailed = false;

      if (cells.every((cell) => cell.hasValue())) {
        const lastCheck = cells.every((cell) => {
          const groupCells = this.table
            .getCellGroup(cell.getGroupId(true))
            .filter((_, i, array) => array.indexOf(cell) !== i);
          const nearbyCells = this.table.getNearbyCells(cell.getCellPosition());
          const reachableCells = [...groupCells, ...nearbyCells];

          return !reachableCells.find((c) => c.getValue() === cell.getValue());
        });

        if (lastCheck) {
          this.log(this.table.print());
          const timeEnd = Date.now();
          console.log("Bitti!", `${timeEnd - timeStart} ms`);
          break;
        } else {
          checkFailed = true;
        }
      }

      const cellCheckFailed = !!cells.find(
        (cell) => !cell.hasValue() && !cell.getPossibleValues().length
      );

      if (cellCheckFailed || checkFailed) {
        backup.useBackup(this.table);
        this.log("Yedek geri yüklendi.");
        backupPending = true;
      }

      if (lastAttempts >= 2) {
        if (!firstBackup && !cellCheckFailed && !checkFailed) {
          backup.setBackup(cells);
          firstBackup = true;
          this.log("Yedek alındı.");
        }

        backupPending = true;
      }

      totalSteps++;

      this.log("steps:", totalSteps);
      this.log("attempts:", lastAttempts);
      this.log(this.table.print());

      lastAttempts = backupPending
        ? 0
        : lastData.isBackupEqual(cells)
          ? lastAttempts + 1
          : 0;

      if (this.waitTime) await wait(this.waitTime);
    }

    // const reloadGroups = (
    //   { backup = new Backup(), lastAttempts = 0 }: ReloadGroupOptions = {
    //     backup: new Backup(),
    //     lastAttempts: 0,
    //   }
    // ): void => {
    //   const cells = this.table.getCells();
    //   // console.log("-".repeat(50));
    //   const groups = Object.values(filterGroups(cells));

    //   lastData.setBackup(cells);

    //   for (const cells of groups) {
    //     for (const cell of cells) {
    //       const cellValue = cell.getValue();
    //       const nearbyCells = this.table.getNearbyCells(cell.getCellPosition());
    //       const allCells = cells
    //         .concat(...nearbyCells)
    //         .filter((cell, index, array) => array.indexOf(cell) === index);

    //       if (cellValue) {
    //         allCells.forEach((cell) => cell.removePossibleValues(cellValue));
    //         cell.resetPossibleValues();
    //         continue;
    //       }

    //       const deletedNumbers = allCells
    //         .map((cell) => cell.getValue())
    //         .filter((value) => value) as number[];
    //       const groupLengthArray = lengthArray(cells);
    //       const lastValues = groupLengthArray.filter(
    //         (number) => !deletedNumbers.includes(number)
    //       );
    //       cell.addPossibleValues(...lastValues);
    //     }
    //   }

    //   for (const cell of cells) {
    //     const groupCells = this.table
    //       .getCellGroup(cell.getGroupId(true))
    //       .filter((_, i, array) => array.indexOf(cell) !== i);
    //     const nearbyCells = this.table.getNearbyCells(cell.getCellPosition());
    //     const reachableCells = [...groupCells, ...nearbyCells];

    //     const onlyNumber =
    //       cell.getIfOnlyOnePossibleValueExists() ??
    //       cell
    //         .getPossibleValues()
    //         .filter(
    //           (number) =>
    //             !groupCells.find((cell) => cell.hasPossibleValue(number))
    //         )
    //         .at(0);
    //     const value = cell.getValue();

    //     if (value) {
    //       reachableCells.forEach((cell) => cell.removePossibleValues(value));
    //       continue;
    //     }

    //     if (onlyNumber) {
    //       reachableCells.forEach((cell) =>
    //         cell.removePossibleValues(onlyNumber)
    //       );
    //       cell.setValue(onlyNumber);
    //       cell.resetPossibleValues();
    //       continue;
    //     }
    //   }

    //   if (backupPending) {
    //     const emptyCells = cells.filter((cell) => !cell.hasValue());

    //     if (emptyCells.length) {
    //       const emptyCell = getRandomItem(emptyCells);

    //       if (!emptyCell.getPossibleValues().length) {
    //         // console.log("Hatalı girdi var.");
    //       } else {
    //         emptyCell
    //           .setValue(getRandomItem(emptyCell.getPossibleValues()))
    //           .removePossibleValues();
    //       }
    //     } else {
    //       // console.log("Boş hücre yok.");
    //     }

    //     backupPending = false;
    //   }

    //   let checkFailed = false;

    //   if (cells.every((cell) => cell.hasValue())) {
    //     const lastCheck = cells.every((cell) => {
    //       const groupCells = this.table
    //         .getCellGroup(cell.getGroupId(true))
    //         .filter((_, i, array) => array.indexOf(cell) !== i);
    //       const nearbyCells = this.table.getNearbyCells(cell.getCellPosition());
    //       const reachableCells = [...groupCells, ...nearbyCells];

    //       return !reachableCells.find((c) => c.getValue() === cell.getValue());
    //     });

    //     if (lastCheck) {
    //       // console.log(this.table.print());
    //       const timeEnd = Date.now();
    //       console.log("Bitti!", `${timeEnd - timeStart} ms`);
    //       return;
    //     } else {
    //       checkFailed = true;
    //     }
    //   }

    //   const cellCheckFailed = !!cells.find(
    //     (cell) => !cell.hasValue() && !cell.getPossibleValues().length
    //   );

    //   if (lastAttempts >= 3 || cellCheckFailed || checkFailed) {
    //     if (!firstBackup && !cellCheckFailed) {
    //       backup.setBackup(cells);
    //       firstBackup = true;
    //       // console.log("Yedek alındı.");
    //     } else {
    //       backup.useBackup(this.table);
    //       // console.log("Yedek geri yüklendi.");
    //       backupPending = true;
    //     }
    //   }

    //   // backup.logBackupCompact();
    //   // console.log("attempts:", lastAttempts);
    //   // console.log(this.table.print());

    //   reloadGroups({
    //     backup,
    //     lastAttempts: backupPending
    //       ? 0
    //       : lastData.isBackupEqual(cells)
    //         ? lastAttempts + 1
    //         : 0,
    //   });
    // };

    // reloadGroups();
  }

  public setCellValue(cellPosition: Position, value?: number): this {
    const cell = this.table.getCell(cellPosition);
    cell.setValue(value);
    return this;
  }

  public addGroupBorders(
    cellPosition: Position,
    addedWalls?: Directions[]
  ): this {
    const walls = this.table.getWalls(cellPosition);
    const directions = addedWalls
      ? Array.from(new Set(addedWalls))
      : (["up", "down", "right", "left"] as const);
    directions.forEach((direction) => walls[direction].setGroupBorder(true));
    return this;
  }

  private setGroups(): void {
    let groupId = randomUUID();
    const tableCells = this.table.getCells();

    for (const cell of tableCells) {
      const cells = this.table.getAvailableCells(cell.getCellPosition());
      const cellMap = Object.values(cells);

      if (!cells.left) groupId = randomUUID();

      cell.setGroupId(groupId);

      for (const nearbyCell of cellMap) {
        const cellGroupID = nearbyCell.getGroupId();

        if (!cellGroupID) {
          nearbyCell.setGroupId(groupId);
          continue;
        }

        tableCells
          .filter((c) => c.getGroupId() === groupId)
          .forEach((c) => c.setGroupId(cellGroupID));

        groupId = cellGroupID;
      }
    }
  }

  private log(...messages: unknown[]): void {
    if (this.logEnabled) console.log(...messages);
  }
}
