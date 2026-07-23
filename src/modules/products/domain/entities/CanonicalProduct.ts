import { Barcode } from '../value-objects/Barcode';
import { ProductMeasurement } from '../value-objects/ProductMeasurement';

export interface CanonicalProductProps {
  id: string;
  name: string;
  barcode?: Barcode;
  measurement?: ProductMeasurement;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CanonicalProduct {
  private props: CanonicalProductProps;

  private constructor(props: CanonicalProductProps) {
    this.props = props;
  }

  /**
   * Factory method for creating a new CanonicalProduct or reconstituting an existing one from the DB.
   */
  public static create(
    props: Omit<CanonicalProductProps, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }
  ): CanonicalProduct {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Canonical Product name cannot be empty.');
    }

    return new CanonicalProduct({
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    });
  }

  // --- Getters ---
  
  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get barcode(): Barcode | undefined {
    return this.props.barcode;
  }

  public get measurement(): ProductMeasurement | undefined {
    return this.props.measurement;
  }

  public get categoryId(): string | undefined {
    return this.props.categoryId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Domain Mutations ---

  /**
   * Assigns a barcode to the product. 
   * Business Rule: A barcode acts as the ultimate source of truth. If one is already assigned, 
   * it cannot be overwritten by a different barcode to prevent accidental data corruption.
   */
  public assignBarcode(newBarcode: Barcode): void {
    if (this.props.barcode && !this.props.barcode.equals(newBarcode)) {
      throw new Error('Cannot overwrite an existing verified barcode with a different barcode.');
    }
    
    this.props.barcode = newBarcode;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the product's standardized measurement.
   */
  public updateMeasurement(measurement: ProductMeasurement): void {
    this.props.measurement = measurement;
    this.props.updatedAt = new Date();
  }
}