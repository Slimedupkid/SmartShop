export class BarcodeAlreadyAssignedError extends Error {
  constructor() {
    super('Cannot overwrite an existing verified barcode with a different barcode.');
    this.name = 'BarcodeAlreadyAssignedError';
    Object.setPrototypeOf(this, BarcodeAlreadyAssignedError.prototype);
  }
}