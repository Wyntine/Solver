import messages from "../messages.json";
import { StringRecord } from "../types";
import { Logger } from "./logger";

export class Messages {
  private data: StringRecord;
  private category: string;

  private logger = new Logger("Messages");

  constructor(categoryName: string) {
    if (!(categoryName in messages)) {
      throw this.logger.createError(
        `Given category name '${categoryName}' is invalid.`
      );
    }

    this.category = categoryName;
    this.data = messages[categoryName as keyof typeof messages];
  }

  public getErrorMessage(messageName: string): string {
    const errorData = this.data["errors"];

    if (
      !errorData ||
      typeof errorData !== "object" ||
      Array.isArray(errorData)
    ) {
      throw this.logger.createError(
        `Given category '${this.category}' does not have an object named 'errors'.`
      );
    }

    const message = errorData[messageName as keyof typeof errorData];

    if (typeof message !== "string") {
      throw this.logger.createError(
        `Given category '${this.category}' does not have string named '${messageName}' in errors.`
      );
    }

    return message;
  }
}
