import { InvalidBarcodeError } from '../errors/InvalidBarcodeError';

export class Barcode {
  private readonly value: string;

  private constructor(rawBarcode: string) {
    const sanitized = Barcode.sanitize(rawBarcode);
    
    if (!Barcode.isValid(sanitized)) {
      throw new InvalidBarcodeError(rawBarcode);
    }

    this.value = sanitized;
    Object.freeze(this);
  }

  /**
   * Factory method to construct a validated Barcode.
   * Throws InvalidBarcodeError if the barcode is mathematically invalid.
   */
  public static create(rawBarcode: string): Barcode {
    return new Barcode(rawBarcode);
  }

  /**
   * Sanitizes raw input by stripping spaces and hyphens.
   */
  private static sanitize(raw: string): string {
    return raw.trim().replace(/[\s-]/g, '');
  }

  /**
   * Validates GTIN standards (GTIN-8, GTIN-12, GTIN-13, GTIN-14) using the standard GS1 Modulus 10 algorithm.
   */
  public static isValid(barcodeStr: string): boolean {
    // Check if it's purely numeric and of a valid GS1 length
    if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(barcodeStr)) {
      return false;
    }

    const digits = barcodeStr.split('').map(Number);
    const providedChecksum = digits.pop()!; // Remove the last digit (the check digit)
    
    let sum = 0;
    
    // GS1 Algorithm: Read right to left. Multiply by 3, then 1, alternating.
    for (let i = digits.length - 1, multiplier = 3; i >= 0; i--) {
      sum += digits[i] * multiplier;
      multiplier = multiplier === 3 ? 1 : 3;
    }

    // The checksum is the distance to the next multiple of 10
    const calculatedChecksum = (10 - (sum % 10)) % 10;
    
    return calculatedChecksum === providedChecksum;
  }

  /**
   * Retrieves the underlying string value of the barcode.
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Compares this Barcode with another Barcode for equality.
   */
  public equals(other: Barcode | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.getValue();
  }
}