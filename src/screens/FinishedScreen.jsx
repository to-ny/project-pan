import { useState, useEffect, useCallback } from 'react';
import { getProductsByStatus, getCategories, getUsageStats } from '../data/db';
import { daysBetween } from '../utils/dateUtils';
import './FinishedScreen.css';

function FinishedScreen({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [usageData, setUsageData] = useState({});
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [categoryList, setCategoryList] = useState([]);

  const loadData = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      getProductsByStatus('finished'),
      getCategories(),
    ]);

    const catMap = {};
    cats.forEach(c => { catMap[c.id] = c; });
    setCategories(catMap);
    setCategoryList(cats);

    prods.sort((a, b) => new Date(b.dateFinished) - new Date(a.dateFinished));
    setProducts(prods);

    const usage = {};
    for (const prod of prods) {
      const stats = await getUsageStats(prod.id);
      const daysActive = prod.dateOpened && prod.dateFinished
        ? daysBetween(prod.dateOpened, prod.dateFinished)
        : 0;
      usage[prod.id] = { ...stats, daysActive };
    }
    setUsageData(usage);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter(p => {
    if (filterCategory && p.categoryId !== Number(filterCategory)) return false;
    if (filterRating && (p.rating || 0) < filterRating) return false;
    return true;
  });

  const groupedProducts = {};
  filteredProducts.forEach(p => {
    const catId = p.categoryId;
    if (!groupedProducts[catId]) {
      groupedProducts[catId] = [];
    }
    groupedProducts[catId].push(p);
  });

  if (products.length === 0) {
    return (
      <div className="screen">
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h3 className="empty-state-title">Aucun produit terminé</h3>
          <p className="empty-state-message">
            Terminez votre premier produit pour célébrer cette victoire !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen finished-screen">
      <div className="filters">
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">Toutes catégories</option>
          {categoryList.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterRating}
          onChange={(e) => setFilterRating(Number(e.target.value))}
        >
          <option value="0">Toutes notes</option>
          <option value="5">★★★★★</option>
          <option value="4">★★★★☆ et +</option>
          <option value="3">★★★☆☆ et +</option>
          <option value="2">★★☆☆☆ et +</option>
          <option value="1">★☆☆☆☆ et +</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-message">Aucun produit ne correspond aux filtres</p>
        </div>
      ) : (
        <div className="finished-groups">
          {Object.entries(groupedProducts).map(([catId, prods]) => {
            const category = categories[catId];
            return (
              <div key={catId} className="category-group">
                <h3 className="group-title" style={{ color: category?.color }}>
                  {category?.name || 'Sans catégorie'}
                </h3>
                <div className="finished-list">
                  {prods.map(product => {
                    const usage = usageData[product.id] || {};
                    return (
                      <div
                        key={product.id}
                        className="finished-card"
                        onClick={() => onProductClick(product)}
                      >
                        <div className="finished-header">
                          <div className="product-names">
                            <h4 className="product-name">{product.name}</h4>
                            <span className="product-brand">{product.brand}</span>
                          </div>
                          {product.rating > 0 && (
                            <div className="rating-display">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span
                                  key={i}
                                  className={`star small ${i < product.rating ? 'filled' : ''}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {product.review && (
                          <p className="review-snippet">
                            {product.review.length > 100
                              ? product.review.substring(0, 100) + '...'
                              : product.review}
                          </p>
                        )}

                        <div className="usage-summary">
                          {usage.totalCount > 0 && (
                            <span className="usage-info">
                              {usage.totalCount} utilisations en {usage.daysActive || 0} jours
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FinishedScreen;
