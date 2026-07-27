'use client';

import { useState } from 'react';

export default function SearchTestPage() {
  const [searchTerm, setSearchTerm] = useState('milk');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/products/search?searchTerm=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (!data.success && data.errors?.length > 0) {
        setError(`${data.errors[0].code}: ${data.errors[0].message}`);
      }
      
      setResult(data);
    } catch (err) {
      setError('A critical network error occurred while reaching the SmartShop API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Live Extraction Test</h1>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', marginTop: '1rem' }}>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter a grocery item..."
          style={{ padding: '0.5rem', flexGrow: 1, border: '1px solid #ccc', borderRadius: '4px' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch} 
          disabled={loading} 
          style={{ padding: '0.5rem 1.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Extracting...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#cc0000', border: '1px solid #ffcdd2', marginBottom: '1rem' }}>
          <strong>Extraction Failed:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Hitting live Checkers API...
        </div>
      )}

      {result && result.data?.length === 0 && !error && !loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No products found for "{searchTerm}".
        </div>
      )}

      {result && result.data?.length > 0 && !loading && (
        <div>
          <p style={{ marginBottom: '1rem', color: '#2e7d32', fontWeight: 'bold' }}>
            Extracted {result.metadata.itemsFound} items in {result.metadata.durationMs}ms
          </p>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {result.data.map((product: any, index: number) => (
              <div key={index} style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{product.name}</h3>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Retailer: {product.retailer}</div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  R {(product.priceInCents / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}