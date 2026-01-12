import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { getCategory, getUsageStats, getMonthlyUsage, getCurrentMonthDays, addUsageLog, moveProductToInUse, moveProductToFinished, getProduct } from '../data/db';
import { formatDate, formatMonthYear, getCurrentMonthInfo, daysBetween } from '../utils/dateUtils';
import './ProductDetail.css';

function ProductDetail({ product: initialProduct, onEdit, onUpdate, onRefresh }) {
  const [product, setProduct] = useState(initialProduct);
  const [category, setCategory] = useState(null);
  const [usageStats, setUsageStats] = useState({});
  const [monthlyUsage, setMonthlyUsage] = useState({});
  const [currentMonthDays, setCurrentMonthDays] = useState([]);
  const [animatingUse, setAnimatingUse] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishRating, setFinishRating] = useState(0);
  const [finishReview, setFinishReview] = useState('');

  const loadData = useCallback(async () => {
    if (!product?.id) return;

    const [cat, stats, monthly, days, freshProduct] = await Promise.all([
      getCategory(product.categoryId),
      getUsageStats(product.id),
      getMonthlyUsage(product.id),
      getCurrentMonthDays(product.id),
      getProduct(product.id),
    ]);

    setCategory(cat);
    setUsageStats(stats);
    setMonthlyUsage(monthly);
    setCurrentMonthDays(days);
    if (freshProduct) {
      setProduct(freshProduct);
    }
  }, [product?.id, product?.categoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogUsage = useCallback(async () => {
    await addUsageLog(product.id);
    setAnimatingUse(true);
    setTimeout(() => setAnimatingUse(false), 600);
    loadData();
    onUpdate?.();
    onRefresh?.();
  }, [product?.id, loadData, onUpdate, onRefresh]);

  const handleStartUsing = useCallback(async () => {
    await moveProductToInUse(product.id);
    const updated = await getProduct(product.id);
    setProduct(updated);
    loadData();
    onUpdate?.();
    onRefresh?.();
  }, [product?.id, loadData, onUpdate, onRefresh]);

  const handleFinish = useCallback(async () => {
    await moveProductToFinished(product.id, finishRating, finishReview);
    setShowFinishModal(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E8735A', '#D4848C', '#5BA3A0', '#D4A65A', '#BA68C8'],
    });

    const updated = await getProduct(product.id);
    setProduct(updated);
    loadData();
    onUpdate?.();
    onRefresh?.();
  }, [product?.id, finishRating, finishReview, loadData, onUpdate, onRefresh]);

  if (!product) return null;

  const { daysInMonth } = getCurrentMonthInfo();
  const daysActive = product.dateOpened && product.dateFinished
    ? daysBetween(product.dateOpened, product.dateFinished)
    : product.dateOpened
      ? daysBetween(product.dateOpened, new Date())
      : 0;

  const sortedMonths = Object.keys(monthlyUsage).sort().reverse();

  return (
    <div className="screen product-detail-screen">
      <div className="detail-card">
        <div className="detail-header">
          <div
            className="detail-category-badge"
            style={{ backgroundColor: category?.color || '#ccc' }}
          >
            {category?.name}
          </div>
          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-brand">{product.brand}</p>
        </div>

        <div className="detail-meta">
          {product.subcategory && (
            <div className="meta-row">
              <span className="meta-label">Type</span>
              <span className="meta-value">{product.subcategory}</span>
            </div>
          )}
          {product.size && (
            <div className="meta-row">
              <span className="meta-label">Contenance</span>
              <span className="meta-value">{product.size} {product.sizeUnit}</span>
            </div>
          )}
          {product.purchaseDate && (
            <div className="meta-row">
              <span className="meta-label">Acheté le</span>
              <span className="meta-value">{formatDate(product.purchaseDate)}</span>
            </div>
          )}
          {product.dateOpened && (
            <div className="meta-row">
              <span className="meta-label">Ouvert le</span>
              <span className="meta-value">{formatDate(product.dateOpened)}</span>
            </div>
          )}
          {product.dateFinished && (
            <div className="meta-row">
              <span className="meta-label">Terminé le</span>
              <span className="meta-value">{formatDate(product.dateFinished)}</span>
            </div>
          )}
        </div>
      </div>

      {product.status === 'in_stock' && (
        <div className="detail-actions">
          <button className="btn btn-primary btn-large" onClick={handleStartUsing}>
            Commencer à utiliser
          </button>
        </div>
      )}

      {product.status === 'in_use' && (
        <>
          <div className="detail-card">
            <h3 className="section-title">Utilisation</h3>
            <div className="usage-stats-grid">
              <div className="stat-box">
                <span className="stat-value">{usageStats.weekCount || 0}</span>
                <span className="stat-label">cette semaine</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{usageStats.monthCount || 0}</span>
                <span className="stat-label">ce mois</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{usageStats.totalCount || 0}</span>
                <span className="stat-label">total</span>
              </div>
            </div>

            <div className="current-month-section">
              <h4 className="subsection-title">Ce mois-ci</h4>
              <div className="usage-grid large">
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <div
                    key={i}
                    className={`usage-square ${currentMonthDays.includes(i + 1) ? 'filled' : ''}`}
                    title={`Jour ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <button
              className={`btn btn-primary btn-large use-btn ${animatingUse ? 'animating' : ''}`}
              onClick={handleLogUsage}
            >
              {animatingUse ? (
                <span className="checkmark-large">✓</span>
              ) : (
                'Utiliser maintenant'
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowFinishModal(true)}
            >
              Marquer comme terminé
            </button>
          </div>

          {sortedMonths.length > 1 && (
            <div className="detail-card">
              <h3 className="section-title">Historique</h3>
              <div className="history-list">
                {sortedMonths.slice(1).map(month => {
                  const data = monthlyUsage[month];
                  const [year, m] = month.split('-');
                  const date = new Date(year, parseInt(m) - 1, 1);
                  return (
                    <div key={month} className="history-item">
                      <span className="history-month">{formatMonthYear(date)}</span>
                      <span className="history-count">{data.count} utilisations</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {product.status === 'finished' && (
        <>
          <div className="detail-card">
            <h3 className="section-title">Résumé</h3>
            <div className="usage-stats-grid">
              <div className="stat-box">
                <span className="stat-value">{usageStats.totalCount || 0}</span>
                <span className="stat-label">utilisations</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{daysActive}</span>
                <span className="stat-label">jours</span>
              </div>
            </div>

            {product.rating > 0 && (
              <div className="rating-section">
                <h4 className="subsection-title">Note</h4>
                <div className="star-rating readonly-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star readonly ${product.rating >= star ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.review && (
              <div className="review-section">
                <h4 className="subsection-title">Avis</h4>
                <p className="review-text">{product.review}</p>
              </div>
            )}
          </div>

          {sortedMonths.length > 0 && (
            <div className="detail-card">
              <h3 className="section-title">Historique complet</h3>
              <div className="history-list">
                {sortedMonths.map(month => {
                  const data = monthlyUsage[month];
                  const [year, m] = month.split('-');
                  const date = new Date(year, parseInt(m) - 1, 1);
                  return (
                    <div key={month} className="history-item">
                      <span className="history-month">{formatMonthYear(date)}</span>
                      <span className="history-count">{data.count} utilisations</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <button className="edit-link" onClick={onEdit}>
        Modifier ce produit
      </button>

      {showFinishModal && (
        <div className="modal-overlay" onClick={() => setShowFinishModal(false)}>
          <div className="modal finish-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Félicitations !</h2>
            </div>
            <div className="modal-body">
              <p className="finish-message">
                Vous avez terminé ce produit ! Souhaitez-vous laisser une note et un avis ?
              </p>

              <div className="form-group">
                <label className="form-label">Note</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${finishRating >= star ? 'filled' : ''}`}
                      onClick={() => setFinishRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Avis (optionnel)</label>
                <textarea
                  className="form-textarea"
                  value={finishReview}
                  onChange={(e) => setFinishReview(e.target.value)}
                  placeholder="Partagez votre expérience..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFinishModal(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleFinish}>
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
