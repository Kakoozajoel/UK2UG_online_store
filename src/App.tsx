import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPortal } from './components/AdminPortal';
import { DriverPortal } from './components/DriverPortal';
import { ShoppingBag, LayoutDashboard, Truck, UserCircle2 } from 'lucide-react';

export default function App() {
  const state = useAppState();
  
  // Simulated System role switcher: 'customer' | 'admin' | 'driver'
  const [activePortal, setActivePortal] = useState<'customer' | 'admin' | 'driver'>('customer');

  return (
    <div className="min-h-screen relative flex flex-col bg-[#F8F9FA]" id="uk2ug-system-root">
      {/* 
        Aesthetic floating system control bar for the AI Studio preview.
        Allows the reviewer to instantly swap roles to test the cohesive e-commerce state machine.
      */}
      <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-white py-2 px-3.5 sm:px-5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.4)] border border-gray-800 flex items-center gap-2 sm:gap-4 backdrop-blur-md"
        id="preview-portal-switcher"
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#008080] border-r border-gray-800 pr-3.5 hidden sm:inline">
          UK2UG Sandbox Switcher
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={() => setActivePortal('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
              activePortal === 'customer'
                ? 'bg-[#008080] text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Customer Store</span>
          </button>

          <button
            onClick={() => setActivePortal('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-[#008080] text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Admin Desk</span>
          </button>

          <button
            onClick={() => setActivePortal('driver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
              activePortal === 'driver'
                ? 'bg-[#008080] text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Rider Portal</span>
          </button>
        </div>
      </div>

      {/* RENDER THE CORRECT PORTAL COMPONENT VIEW */}
      <div className="flex-1 flex flex-col" id="active-portal-container">
        {activePortal === 'customer' && (
          <CustomerPortal
            products={state.products}
            categories={state.categories}
            districts={state.districts}
            orders={state.orders}
            imports={state.imports}
            reviews={state.reviews}
            customers={state.customers}
            messages={state.messages}
            cart={state.cart}
            wishlist={state.wishlist}
            currentUser={state.currentUser}
            setCurrentUser={state.setCurrentUser}
            addToCart={state.addToCart}
            updateCartQty={state.updateCartQty}
            removeFromCart={state.removeFromCart}
            clearCart={state.clearCart}
            toggleWishlist={state.toggleWishlist}
            placeOrder={state.placeOrder}
            submitImportRequest={state.submitImportRequest}
            addReview={state.addReview}
            registerCustomer={state.registerCustomer}
            sendMessage={state.sendMessage}
            markMessagesAsReadByCustomer={state.markMessagesAsReadByCustomer}
            banner={state.banner}
            complaints={state.complaints}
            addComplaint={state.addComplaint}
          />
        )}

        {activePortal === 'admin' && (
          <AdminPortal
            products={state.products}
            categories={state.categories}
            districts={state.districts}
            orders={state.orders}
            imports={state.imports}
            customers={state.customers}
            messages={state.messages}
            complaints={state.complaints}
            addProduct={state.addProduct}
            updateProduct={state.updateProduct}
            deleteProduct={state.deleteProduct}
            addCategory={state.addCategory}
            deleteCategory={state.deleteCategory}
            addDistrict={state.addDistrict}
            updateDistrictFee={state.updateDistrictFee}
            deleteDistrict={state.deleteDistrict}
            updateOrderStatus={state.updateOrderStatus}
            updateImportStatus={state.updateImportStatus}
            updateCustomerStatus={state.updateCustomerStatus}
            deleteCustomer={state.deleteCustomer}
            sendMessage={state.sendMessage}
            markMessagesAsReadByAdmin={state.markMessagesAsReadByAdmin}
            banner={state.banner}
            updateBanner={state.updateStorefrontBanner}
            addComplaint={state.addComplaint}
            updateComplaintStatus={state.updateComplaintStatus}
            deleteComplaint={state.deleteComplaint}
            updatePreOrderStatus={state.updatePreOrderStatus}
            toggleProductPreOrder={state.toggleProductPreOrder}
          />
        )}

        {activePortal === 'driver' && (
          <DriverPortal 
            orders={state.orders} 
            updateOrderStatus={state.updateOrderStatus} 
          />
        )}
      </div>
    </div>
  );
}
