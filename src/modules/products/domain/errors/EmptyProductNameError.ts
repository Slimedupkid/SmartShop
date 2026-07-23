export class EmptyProductNameError extends Error {
  constructor() {
    super('Canonical Product name cannot be empty.');
    this.name = 'EmptyProductNameError';
    Object.setPrototypeOf(this, EmptyProductNameError.prototype);
  }
}