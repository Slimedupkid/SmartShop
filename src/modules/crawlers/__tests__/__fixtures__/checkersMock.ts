export const checkersMockResponse = {
  products: [
    {
      id: "10111222",
      articleNumber: "10111222",
      displayName: "Checkers House Brand Full Cream Milk 2L",
      brand: "House Brand",
      discountedPrice: 24.99,
      price: 26.99,
      barcodes: ["6001234567890"],
      active: true
    },
    {
      id: "10111333",
      articleNumber: "10111333",
      displayName: "Out of Stock Item",
      // Notice: missing brand, missing discounted price
      price: 15.00,
      barcodes: [], // empty barcode array
      active: false // out of stock
    }
  ]
};

export const malformedMockResponse = {
  // Missing the 'products' array completely
  metadata: { totalCount: 0 }
};