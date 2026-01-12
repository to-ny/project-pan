import { useState, useEffect, useCallback } from 'react';
import { getProductsByStatus, getCategories, getUsageStats, getCurrentMonthDays, addUsageLog } from '../data/db';
import { getCurrentMonthInfo } from '../utils/dateUtils';
import './HomeScreen.css';

function HomeScreen({ onProductClick, onRefresh }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [usageData, setUsageData] = useState({});
  const [animatingId, setAnimatingId] = useState(null);

  const loadData = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      getProductsByStatus('in_use'),
      getCategories(),
    ]);

    const catMap = {};
    cats.forEach(c => { catMap[c.id] = c; });
    setCategories(catMap);

    prods.sort((a, b) => {
      const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return bTime - aTime;
    });
    setProducts(prods);

    const usage = {};
    for (const prod of prods) {
      const [stats, days] = await Promise.all([
        getUsageStats(prod.id),
        getCurrentMonthDays(prod.id),
      ]);
      usage[prod.id] = { stats, days };
    }
    setUsageData(usage);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogUsage = useCallback(async (e, productId) => {
    e.stopPropagation();
    await addUsageLog(productId);
    setAnimatingId(productId);
    setTimeout(() => setAnimatingId(null), 600);
    loadData();
    onRefresh?.();
  }, [loadData, onRefresh]);

  if (products.length === 0) {
    return (
      <div className="screen">
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <h3 className="empty-state-title">Aucun produit en cours</h3>
          <p className="empty-state-message">
            Commencez à utiliser un produit de votre stock pour le voir apparaître ici !
          </p>
        </div>
      </div>
    );
  }

  const { daysInMonth } = getCurrentMonthInfo();

  return (
    <div className="screen home-screen">
      <div className="products-list">
        {products.map(product => {
          const category = categories[product.categoryId];
          const usage = usageData[product.id] || { stats: {}, days: [] };

          return (
            <div
              key={product.id}
              className="product-card"
              onClick={() => onProductClick(product)}
            >
              <div
                className="category-bar"
                style={{ backgroundColor: category?.color || '#ccc' }}
              />
              <div className="product-info">
                <div className="product-header">
                  <div className="product-names">
                    <h3 className="product-name">{product.name}</h3>
                    <span className="product-brand">{product.brand}</span>
                  </div>
                  <button
                    className={`use-button ${animatingId === product.id ? 'animating' : ''}`}
                    onClick={(e) => handleLogUsage(e, product.id)}
                  >
                    {animatingId === product.id ? (
                      <span className="checkmark">✓</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    )}
                  </button>
                </div>

                <div className="usage-stats">
                  <span className="usage-stat">
                    <strong>{usage.stats.weekCount || 0}</strong> cette semaine
                  </span>
                  <span className="usage-stat">
                    <strong>{usage.stats.monthCount || 0}</strong> ce mois
                  </span>
                </div>

                <div className="usage-grid">
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <div
                      key={i}
                      className={`usage-square ${usage.days?.includes(i + 1) ? 'filled' : ''}`}
                      title={`Jour ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomeScreen;
