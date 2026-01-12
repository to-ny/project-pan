import { useState, useEffect, useCallback } from 'react';
import { getDB } from './data/db';
import { seedTestData } from './data/seedData';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FloatingActionButton from './components/FloatingActionButton';
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
import FinishedScreen from './screens/FinishedScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ProductForm from './screens/ProductForm';
import ProductDetail from './screens/ProductDetail';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      await getDB();
      await seedTestData();
      setDbReady(true);
    }
    init();
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const navigateTo = useCallback((screen) => {
    setCurrentScreen(screen);
    setSelectedProduct(null);
    setEditingProduct(null);
  }, []);

  const openProduct = useCallback((product) => {
    setSelectedProduct(product);
    setCurrentScreen('detail');
  }, []);

  const openAddProduct = useCallback(() => {
    setEditingProduct(null);
    setCurrentScreen('form');
  }, []);

  const openEditProduct = useCallback((product) => {
    setEditingProduct(product);
    setCurrentScreen('form');
  }, []);

  const handleFormSave = useCallback(() => {
    refresh();
    navigateTo('home');
  }, [refresh, navigateTo]);

  const handleFormCancel = useCallback(() => {
    if (selectedProduct) {
      setCurrentScreen('detail');
    } else {
      navigateTo('home');
    }
  }, [selectedProduct, navigateTo]);

  const handleProductUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  const showFAB = ['home', 'inventory'].includes(currentScreen);

  if (!dbReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            key={refreshKey}
            onProductClick={openProduct}
            onRefresh={refresh}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            key={refreshKey}
            onProductClick={openProduct}
            onRefresh={refresh}
          />
        );
      case 'finished':
        return (
          <FinishedScreen
            key={refreshKey}
            onProductClick={openProduct}
          />
        );
      case 'categories':
        return (
          <CategoriesScreen
            key={refreshKey}
            onRefresh={refresh}
          />
        );
      case 'form':
        return (
          <ProductForm
            product={editingProduct}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            onRefresh={refresh}
          />
        );
      case 'detail':
        return (
          <ProductDetail
            product={selectedProduct}
            onBack={() => navigateTo(selectedProduct?.status === 'in_stock' ? 'inventory' : selectedProduct?.status === 'finished' ? 'finished' : 'home')}
            onEdit={() => openEditProduct(selectedProduct)}
            onUpdate={handleProductUpdate}
            onRefresh={refresh}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Header
        title={getScreenTitle(currentScreen, selectedProduct, editingProduct)}
        showBack={['form', 'detail'].includes(currentScreen)}
        onBack={() => {
          if (currentScreen === 'form') {
            handleFormCancel();
          } else if (currentScreen === 'detail') {
            navigateTo(selectedProduct?.status === 'in_stock' ? 'inventory' : selectedProduct?.status === 'finished' ? 'finished' : 'home');
          }
        }}
      />
      <main className="app-content">
        {renderScreen()}
      </main>
      {!['form', 'detail'].includes(currentScreen) && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={navigateTo}
        />
      )}
      {showFAB && (
        <FloatingActionButton onClick={openAddProduct} />
      )}
    </div>
  );
}

function getScreenTitle(screen, product, editing) {
  switch (screen) {
    case 'home':
      return 'ProjectPan';
    case 'inventory':
      return 'Mon Stock';
    case 'finished':
      return 'Terminés';
    case 'categories':
      return 'Catégories';
    case 'form':
      return editing ? 'Modifier' : 'Ajouter';
    case 'detail':
      return product?.name || 'Détail';
    default:
      return 'ProjectPan';
  }
}

export default App;
