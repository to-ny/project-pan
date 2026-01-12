import { useState, useEffect, useCallback } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory, CATEGORY_COLORS, getProductsByCategory } from '../data/db';
import './CategoriesScreen.css';

function CategoriesScreen({ onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [productCount, setProductCount] = useState(0);

  const loadCategories = useCallback(async () => {
    const cats = await getCategories();
    setCategories(cats);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    await addCategory({ name: newCategoryName.trim(), subcategories: [] });
    setNewCategoryName('');
    setShowAddCategory(false);
    loadCategories();
    onRefresh?.();
  }, [newCategoryName, loadCategories, onRefresh]);

  const handleUpdateCategoryName = useCallback(async (id, name) => {
    if (!name.trim()) return;
    await updateCategory(id, { name: name.trim() });
    setEditingCategory(null);
    loadCategories();
    onRefresh?.();
  }, [loadCategories, onRefresh]);

  const handleUpdateCategoryColor = useCallback(async (id, color) => {
    await updateCategory(id, { color });
    setShowColorPicker(null);
    loadCategories();
    onRefresh?.();
  }, [loadCategories, onRefresh]);

  const handleDeleteCategory = useCallback(async (id) => {
    const products = await getProductsByCategory(id);
    setProductCount(products.length);
    setConfirmDelete(id);
  }, []);

  const confirmDeleteCategory = useCallback(async () => {
    await deleteCategory(confirmDelete);
    setConfirmDelete(null);
    loadCategories();
    onRefresh?.();
  }, [confirmDelete, loadCategories, onRefresh]);

  const handleAddSubcategory = useCallback(async (categoryId) => {
    if (!newSubcategoryName.trim()) return;
    const category = categories.find(c => c.id === categoryId);
    const subcategories = [...(category.subcategories || []), newSubcategoryName.trim()];
    await updateCategory(categoryId, { subcategories });
    setNewSubcategoryName('');
    loadCategories();
    onRefresh?.();
  }, [newSubcategoryName, categories, loadCategories, onRefresh]);

  const handleUpdateSubcategory = useCallback(async (categoryId, oldName, newName) => {
    if (!newName.trim()) return;
    const category = categories.find(c => c.id === categoryId);
    const subcategories = category.subcategories.map(s => s === oldName ? newName.trim() : s);
    await updateCategory(categoryId, { subcategories });
    setEditingSubcategory(null);
    loadCategories();
    onRefresh?.();
  }, [categories, loadCategories, onRefresh]);

  const handleDeleteSubcategory = useCallback(async (categoryId, subName) => {
    const category = categories.find(c => c.id === categoryId);
    const subcategories = category.subcategories.filter(s => s !== subName);
    await updateCategory(categoryId, { subcategories });
    loadCategories();
    onRefresh?.();
  }, [categories, loadCategories, onRefresh]);

  return (
    <div className="screen categories-screen">
      <div className="categories-list">
        {categories.map(category => (
          <div key={category.id} className="category-item">
            <div
              className="category-header"
              onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}
            >
              <div
                className="category-color"
                style={{ backgroundColor: category.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(category.id);
                }}
              />
              {editingCategory === category.id ? (
                <input
                  type="text"
                  className="category-name-input"
                  defaultValue={category.name}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onBlur={(e) => handleUpdateCategoryName(category.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateCategoryName(category.id, e.target.value);
                    if (e.key === 'Escape') setEditingCategory(null);
                  }}
                />
              ) : (
                <span className="category-name">{category.name}</span>
              )}
              <div className="category-actions">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(category.id);
                  }}
                  title="Renommer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  title="Supprimer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
                <svg
                  className={`expand-icon ${expandedId === category.id ? 'expanded' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {expandedId === category.id && (
              <div className="subcategories-section">
                <div className="subcategories-list">
                  {(category.subcategories || []).map((sub, idx) => (
                    <div key={idx} className="subcategory-item">
                      {editingSubcategory === `${category.id}-${sub}` ? (
                        <input
                          type="text"
                          className="subcategory-input"
                          defaultValue={sub}
                          autoFocus
                          onBlur={(e) => handleUpdateSubcategory(category.id, sub, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSubcategory(category.id, sub, e.target.value);
                            if (e.key === 'Escape') setEditingSubcategory(null);
                          }}
                        />
                      ) : (
                        <span className="subcategory-name">{sub}</span>
                      )}
                      <div className="subcategory-actions">
                        <button
                          className="action-btn small"
                          onClick={() => setEditingSubcategory(`${category.id}-${sub}`)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="action-btn small delete"
                          onClick={() => handleDeleteSubcategory(category.id, sub)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="add-subcategory">
                  <input
                    type="text"
                    placeholder="Nouvelle sous-catégorie..."
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubcategory(category.id);
                    }}
                  />
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => handleAddSubcategory(category.id)}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="add-category-btn"
        onClick={() => setShowAddCategory(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Ajouter une catégorie
      </button>

      {showAddCategory && (
        <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nouvelle catégorie</h2>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="form-input"
                placeholder="Nom de la catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddCategory(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleAddCategory}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {showColorPicker && (
        <div className="modal-overlay" onClick={() => setShowColorPicker(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Choisir une couleur</h2>
            </div>
            <div className="modal-body">
              <div className="color-picker-grid">
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => handleUpdateCategoryColor(showColorPicker, color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirmer la suppression</h2>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                {productCount > 0
                  ? `Cette catégorie contient ${productCount} produit${productCount > 1 ? 's' : ''}. La suppression entraînera la perte de ces produits.`
                  : 'Voulez-vous vraiment supprimer cette catégorie ?'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
              <button className="btn btn-primary btn-danger" onClick={confirmDeleteCategory}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesScreen;
