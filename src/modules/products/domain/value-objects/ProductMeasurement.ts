import { InvalidMeasurementError } from '../errors/InvalidMeasurementError';

export type UnitOfMeasure = 'g' | 'kg' | 'ml' | 'L' | 'unit';

export class ProductMeasurement {
  private constructor(
    private readonly size: number,
    private readonly unit: UnitOfMeasure
  ) {
    Object.freeze(this);
  }

  /**
   * Factory method to construct a validated ProductMeasurement.
   * Throws InvalidMeasurementError if the size is zero or negative.
   */
  public static create(size: number, unit: UnitOfMeasure): ProductMeasurement {
    if (size <= 0) {
      throw new InvalidMeasurementError('Product size must be strictly positive.');
    }
    return new ProductMeasurement(size, unit);
  }

  public getSize(): number {
    return this.size;
  }

  public getUnit(): UnitOfMeasure {
    return this.unit;
  }

  /**
   * Returns a normalized string representation (e.g., "2 L", "500 g")
   */
  public toString(): string {
    return `${this.size} ${this.unit}`;
  }

  public equals(other: ProductMeasurement | null | undefined): boolean {
    if (!other) return false;
    return this.size === other.getSize() && this.unit === other.getUnit();
  }
}