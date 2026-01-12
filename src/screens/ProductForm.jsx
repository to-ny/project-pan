import { useState, useEffect, useCallback } from 'react';
import { getCategories, addProduct, updateProduct, deleteProduct } from '../data/db';
import './ProductForm.css';

function ProductForm({ product, onSave, onCancel, onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    categoryId: '',
    subcategory: '',
    status: 'in_stock',
    size: '',
    sizeUnit: 'ml',
    purchaseDate: '',
    rating: 0,
    review: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const loadCategories = useCallback(async () => {
    const cats = await getCategories();
    setCategories(cats);
    if (!product && cats.length > 0) {
      setFormData(prev => prev.categoryId ? prev : { ...prev, categoryId: cats[0].id });
    }
  }, [product]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        categoryId: product.categoryId || '',
        subcategory: product.subcategory || '',
        status: product.status || 'in_stock',
        size: product.size || '',
        sizeUnit: product.sizeUnit || 'ml',
        purchaseDate: product.purchaseDate ? product.purchaseDate.split('T')[0] : '',
        rating: product.rating || 0,
        review: product.review || '',
      });
    }
  }, [product]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev[field] ? { ...prev, [field]: null } : prev);
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.brand.trim()) newErrors.brand = 'La marque est requise';
    if (!formData.categoryId) newErrors.categoryId = 'La catégorie est requise';
    if (!formData.subcategory) newErrors.subcategory = 'La sous-catégorie est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      categoryId: Number(formData.categoryId),
      subcategory: formData.subcategory,
      status: formData.status,
      size: formData.size ? Number(formData.size) : null,
      sizeUnit: formData.sizeUnit,
      purchaseDate: formData.purchaseDate || null,
    };

    if (formData.status === 'finished') {
      data.rating = formData.rating;
      data.review = formData.review.trim();
    }

    if (product) {
      await updateProduct(product.id, data);
    } else {
      await addProduct(data);
    }

    onSave?.();
  }, [formData, product, validate, onSave]);

  const handleDelete = useCallback(async () => {
    await deleteProduct(product.id);
    onRefresh?.();
    onCancel?.();
  }, [product, onRefresh, onCancel]);

  const selectedCategory = categories.find(c => c.id === Number(formData.categoryId));
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <div className="screen product-form-screen">
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label className="form-label">Nom du produit *</label>
          <input
            type="text"
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Sérum Vitamine C"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Marque *</label>
          <input
            type="text"
            className={`form-input ${errors.brand ? 'error' : ''}`}
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="Ex: La Roche-Posay"
          />
          {errors.brand && <span className="form-error">{errors.brand}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Catégorie *</label>
          <select
            className={`form-select ${errors.categoryId ? 'error' : ''}`}
            value={formData.categoryId}
            onChange={(e) => {
              handleChange('categoryId', e.target.value);
              handleChange('subcategory', '');
            }}
          >
            <option value="">Sélectionner...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Sous-catégorie *</label>
          <select
            className={`form-select ${errors.subcategory ? 'error' : ''}`}
            value={formData.subcategory}
            onChange={(e) => handleChange('subcategory', e.target.value)}
            disabled={!formData.categoryId}
          >
            <option value="">Sélectionner...</option>
            {subcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          {errors.subcategory && <span className="form-error">{errors.subcategory}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Statut</label>
          <div className="status-selector">
            {[
              { value: 'in_stock', label: 'En stock' },
              { value: 'in_use', label: 'En cours' },
              { value: 'finished', label: 'Terminé' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`status-option ${formData.status === opt.value ? 'active' : ''}`}
                onClick={() => handleChange('status', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contenance</label>
            <input
              type="number"
              className="form-input"
              value={formData.size}
              onChange={(e) => handleChange('size', e.target.value)}
              placeholder="50"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unité</label>
            <select
              className="form-select"
              value={formData.sizeUnit}
              onChange={(e) => handleChange('sizeUnit', e.target.value)}
            >
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="unités">unités</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date d'achat</label>
          <input
            type="date"
            className="form-input"
            value={formData.purchaseDate}
            onChange={(e) => handleChange('purchaseDate', e.target.value)}
          />
        </div>

        {formData.status === 'finished' && (
          <>
            <div className="form-group">
              <label className="form-label">Note</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${formData.rating >= star ? 'filled' : ''}`}
                    onClick={() => handleChange('rating', star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Avis</label>
              <textarea
                className="form-textarea"
                value={formData.review}
                onChange={(e) => handleChange('review', e.target.value)}
                placeholder="Partagez votre expérience avec ce produit..."
              />
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            {product ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

        {product && (
          <button
            type="button"
            className="delete-link"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer ce produit
          </button>
        )}
      </form>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Supprimer le produit ?</h2>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                Cette action est irréversible. Tout l'historique d'utilisation sera également supprimé.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </button>
              <button className="btn btn-primary btn-danger" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductForm;
