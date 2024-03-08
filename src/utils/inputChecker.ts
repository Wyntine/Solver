import { Logger } from "../classes/logger";
import { Messages } from "../classes/messages";

export function inputChecker<Inputs extends [unknown, string][]>(
  inputs: Inputs,
  logger: Logger,
  messages: Messages,
  statement: (input: unknown) => boolean
): void {
  for (const [input, message] of inputs) {
    if (statement(input)) continue;

    throw logger.createError(messages.getErrorMessage(message));
  }
}
