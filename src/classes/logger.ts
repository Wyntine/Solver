export class Logger {
  private name: string;

  constructor(loggerName: string) {
    this.name = loggerName;
  }

  public error(...messages: unknown[]): void {
    console.error(`[${this.name}]`, ...messages);
  }

  public createError(...messages: (string | number)[]): Error {
    return new Error(this.errorMessage(...messages));
  }

  public errorMessage(...messages: (string | number)[]): string {
    return `[${this.name}] ${messages.join(" ")}`;
  }
}
