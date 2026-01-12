import { useState, useEffect, useCallback } from 'react';
import { getProductsByStatus, getCategories, moveProductToInUse } from '../data/db';
import { formatShortDate } from '../utils/dateUtils';
import './InventoryScreen.css';

function InventoryScreen({ onProductClick, onRefresh }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});

  const loadData = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      getProductsByStatus('in_stock'),
      getCategories(),
    ]);

    const catMap = {};
    cats.forEach(c => { catMap[c.id] = c; });
    setCategories(catMap);

    prods.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setProducts(prods);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartUsing = useCallback(async (e, productId) => {
    e.stopPropagation();
    await moveProductToInUse(productId);
    loadData();
    onRefresh?.();
  }, [loadData, onRefresh]);

  if (products.length === 0) {
    return (
      <div className="screen">
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3 className="empty-state-title">Stock vide</h3>
          <p className="empty-state-message">
            Votre inventaire est clair ! Ajoutez de nouveaux produits pour commencer à suivre votre collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen inventory-screen">
      <div className="products-list">
        {products.map(product => {
          const category = categories[product.categoryId];

          return (
            <div
              key={product.id}
              className="inventory-card"
              onClick={() => onProductClick(product)}
            >
              <div
                className="category-bar"
                style={{ backgroundColor: category?.color || '#ccc' }}
              />
              <div className="inventory-info">
                <div className="inventory-header">
                  <div className="product-names">
                    <h3 className="product-name">{product.name}</h3>
                    <span className="product-brand">{product.brand}</span>
                  </div>
                </div>

                <div className="inventory-meta">
                  {product.purchaseDate && (
                    <span className="meta-item">
                      Acheté le {formatShortDate(product.purchaseDate)}
                    </span>
                  )}
                  {product.size && (
                    <span className="meta-item">
                      {product.size} {product.sizeUnit}
                    </span>
                  )}
                </div>

                <button
                  className="start-button"
                  onClick={(e) => handleStartUsing(e, product.id)}
                >
                  Commencer à utiliser
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InventoryScreen;
