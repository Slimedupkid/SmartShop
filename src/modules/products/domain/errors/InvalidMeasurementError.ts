export class InvalidMeasurementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMeasurementError';
    Object.setPrototypeOf(this, InvalidMeasurementError.prototype);
  }
}