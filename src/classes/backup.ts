import { BackupData } from "../types";
import { copy } from "../utils/object";
import { Cell } from "./cell";
import { Table } from "./table";

export class Backup {
  private cellData: BackupData[] = [];

  public setBackup(cells: Cell[]): this {
    this.cellData = this.convertToBackup(cells);
    return this;
  }

  public hasBackup(): boolean {
    return !!this.cellData.length;
  }

  public getBackup(): BackupData[] {
    return this.cellData;
  }

  public isBackupEqual(backupData: Cell[] | Backup) {
    const data =
      backupData instanceof Backup
        ? backupData.getBackup()
        : this.convertToBackup(backupData);

    const currentBackup = this.getBackup();

    return currentBackup.every((item, index) => {
      const cell = data[index];

      if (!cell) return false;

      const groupCheck = item.groupId === cell.groupId;
      const xCheck = item.position.x === cell.position.x;
      const yCheck = item.position.y === cell.position.y;
      const valueCheck = item.value === cell.value;
      const possibleLengthCheck =
        item.possibleValues.length === cell.possibleValues.length;
      const possibleCheck1 = item.possibleValues.every((i) =>
        cell.possibleValues.includes(i)
      );
      const possibleCheck2 = cell.possibleValues.every((i) =>
        item.possibleValues.includes(i)
      );

      return (
        groupCheck &&
        xCheck &&
        yCheck &&
        valueCheck &&
        possibleLengthCheck &&
        possibleCheck1 &&
        possibleCheck2
      );
    });
  }

  public logBackupCompact(): void {
    for (const cell of this.cellData) {
      console.log(
        (() => {
          const { x, y } = cell.position;
          const value = cell.value;
          const possibleValues = cell.possibleValues;
          return `x: ${x}, y: ${y} | value: ${value} | pValues: ${possibleValues.join(", ")}`;
        })()
      );
    }
  }

  public useBackup(table: Table): void {
    for (const newCell of this.cellData) {
      const oldCell = table.getCell(newCell.position);

      oldCell
        .setValue(newCell.value)
        .addPossibleValues(...newCell.possibleValues)
        .setGroupId(newCell.groupId);
    }
  }

  private convertToBackup(cells: Cell[]): BackupData[] {
    return cells.map((cell) => ({
      position: copy(cell.getCellPosition()),
      value: cell.getValue(),
      possibleValues: [...cell.getPossibleValues()],
      groupId: cell.getGroupId(),
    }));
  }
}
