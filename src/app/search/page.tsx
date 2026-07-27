'use client';

import { useState } from 'react';

export default function Home() {
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
      setError('A network error occurred while reaching the API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>SmartShop MVP</h1>
      
      {/* 1. Search Box & Button */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          style={{ padding: '0.5rem', flexGrow: 1, border: '1px solid #ccc', borderRadius: '4px' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch} 
          disabled={loading} 
          style={{ padding: '0.5rem 1.5rem' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* 2. Error State */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#cc0000', marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 3. Loading State */}
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Extracting live data...
        </div>
      )}

      {/* 4. Empty State */}
      {result && result.data?.length === 0 && !error && !loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No products found.
        </div>
      )}

      {/* 5. Results List */}
      {result && result.data?.length > 0 && !loading && (
        <div>
          <p style={{ marginBottom: '1rem', color: 'green', fontWeight: 'bold' }}>
            Extracted {result.metadata.itemsFound} items in {result.metadata.durationMs}ms
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.data.map((product: any, index: number) => (
              <div key={index} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>{product.retailer}</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
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