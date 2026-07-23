export class InvalidBarcodeError extends Error {
  constructor(invalidBarcode: string) {
    super(`Invalid GTIN/EAN barcode provided: "${invalidBarcode}". Must be a valid 8, 12, 13, or 14-digit numeric barcode with a correct checksum.`);
    this.name = 'InvalidBarcodeError';
    
    // Required to maintain the correct prototype chain in TypeScript when extending Error
    Object.setPrototypeOf(this, InvalidBarcodeError.prototype);
  }
}