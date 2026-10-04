import { useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPortal } from './components/AdminPortal';
import { DriverPortal } from './components/DriverPortal';
import { ShoppingBag, LayoutDashboard, Truck, ShieldCheck, LogOut, ShieldAlert, ArrowLeft } from 'lucide-react';
import { ADMIN_UID } from './types';
import { isAdminUser, isRiderUser } from './lib/rbac';

export default function App() {
  const state = useAppState();
  
  // Active portal defaults to customer, but automatically routes when role changes
  const [activePortal, setActivePortal] = useState<'customer' | 'admin' | 'driver'>('customer');

  const isAdmin = isAdminUser(state.currentUser?.email, state.currentUser?.uid) || state.currentUser?.role === 'admin';
  const isRider = isRiderUser(state.currentUser?.email) || state.currentUser?.role === 'driver';

  // Automatically route user strictly according to authenticated RBAC role
  useEffect(() => {
    if (isAdmin) {
      setActivePortal('admin');
    } else if (isRider) {
      setActivePortal('driver');
    } else {
      setActivePortal('customer');
    }
  }, [state.currentUser?.uid, state.currentUser?.email, state.currentUser?.role, isAdmin, isRider]);

  const handleLogout = async () => {
    await state.logout();
    setActivePortal('customer');
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#F8F9FA]" id="uk2ug-system-root">
      {/* 
        Aesthetic floating system control bar for the AI Studio preview.
        Enforces RBAC indications and role verification.
      */}
      <div 
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-white py-1.5 px-2.5 sm:py-2 sm:px-5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.4)] border border-gray-800 flex items-center gap-1.5 sm:gap-4 backdrop-blur-md max-w-[96vw] overflow-x-auto scrollbar-none"
        id="preview-portal-switcher"
      >
        <div className="flex items-center gap-2 border-r border-gray-800 pr-3.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ea580c] hidden sm:inline">
            UK2UG
          </span>
          {isAdmin ? (
            <span className="px-2 py-0.5 bg-purple-700 text-white rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </span>
          ) : isRider ? (
            <span className="px-2 py-0.5 bg-orange-800 text-orange-200 border border-orange-700/60 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3 text-orange-300" />
              Rider
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
              {state.currentUser ? state.currentUser.name : 'Guest Customer'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={() => setActivePortal('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
              activePortal === 'customer'
                ? 'bg-[#ea580c] text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Customer View</span>
          </button>

          <button
            onClick={() => setActivePortal('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-purple-700 text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Admin View</span>
            {isAdmin && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActivePortal('driver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
              activePortal === 'driver'
                ? 'bg-[#ea580c] text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Rider Portal</span>
            {(isRider || isAdmin) && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
            )}
          </button>

          {state.currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer text-red-400 hover:text-white hover:bg-red-950/60 border border-red-900/60 ml-1"
              title="Logout Active Account"
              id="global-switcher-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER THE CORRECT PORTAL COMPONENT VIEW PROTECTED BY STRICT RBAC GUARDS */}
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
            deleteOrder={state.deleteOrder}
            submitImportRequest={state.submitImportRequest}
            deleteImportRequest={state.deleteImportRequest}
            addReview={state.addReview}
            registerCustomer={state.registerCustomer}
            sendMessage={state.sendMessage}
            markMessagesAsReadByCustomer={state.markMessagesAsReadByCustomer}
            banner={state.banner}
            complaints={state.complaints}
            addComplaint={state.addComplaint}
            notifications={state.notifications}
            markNotificationAsRead={state.markNotificationAsRead}
            deleteNotification={state.deleteNotification}
            updateOrderPaymentDetails={state.updateOrderPaymentDetails}
          />
        )}

        {activePortal === 'admin' && (
          isAdmin ? (
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
              deleteOrder={state.deleteOrder}
              verifyOrderPayment={state.verifyOrderPayment}
              updateOrderPaymentDetails={state.updateOrderPaymentDetails}
              confirmOrderHandover={state.confirmOrderHandover}
              batchDeleteCompletedRiderOrders={state.batchDeleteCompletedRiderOrders}
              notifications={state.notifications}
              riders={state.riders}
              saveRiderProfile={state.saveRiderProfile}
              updateRiderStatus={state.updateRiderStatus}
              deleteRider={state.deleteRider}
              assignRiderToOrder={state.assignRiderToOrder}
              updateImportStatus={state.updateImportStatus}
              deleteImportRequest={state.deleteImportRequest}
              updateCustomerStatus={state.updateCustomerStatus}
              deleteCustomer={state.deleteCustomer}
              sendMessage={state.sendMessage}
              deleteMessage={state.deleteMessage}
              deleteConversation={state.deleteConversation}
              markMessagesAsReadByAdmin={state.markMessagesAsReadByAdmin}
              banner={state.banner}
              updateBanner={state.updateStorefrontBanner}
              addComplaint={state.addComplaint}
              updateComplaintStatus={state.updateComplaintStatus}
              deleteComplaint={state.deleteComplaint}
              updatePreOrderStatus={state.updatePreOrderStatus}
              toggleProductPreOrder={state.toggleProductPreOrder}
              onLogout={handleLogout}
            />
          ) : (
            /* RBAC Access Denied Guard Screen for Admin */
            <div className="flex-1 flex items-center justify-center p-6 bg-[#F8F9FA] min-h-screen">
              <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-150 p-8 text-center space-y-6 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                    403 Forbidden • RBAC Protected
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Administrator Privileges Required</h2>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    The <strong>UK2UG Admin Control Center</strong> is restricted strictly to authorized store administrators.
                  </p>
                  {state.currentUser ? (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Signed In As:</span>
                        <strong className="text-gray-900 font-mono">{state.currentUser.email}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Assigned Role:</span>
                        <span className="uppercase text-amber-700 font-bold font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {state.currentUser.role}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      You are currently browsing as a Guest. Please sign in with an authorized admin account.
                    </p>
                  )}
                </div>
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={() => setActivePortal('customer')}
                    className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Customer Storefront
                  </button>
                  {state.currentUser && (
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Sign Out of Current Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {activePortal === 'driver' && (
          (isRider || isAdmin) ? (
            <DriverPortal 
              orders={state.orders} 
              updateOrderStatus={state.updateOrderStatus}
              confirmOrderHandover={state.confirmOrderHandover}
              deleteOrder={state.deleteOrder}
              currentDriver={state.currentUser}
              saveRiderProfile={state.saveRiderProfile}
              riders={state.riders}
              onLogout={handleLogout}
            />
          ) : (
            /* RBAC Access Denied Guard Screen for Rider Portal */
            <div className="flex-1 flex items-center justify-center p-6 bg-[#121212] min-h-screen text-gray-100">
              <div className="max-w-md w-full bg-[#1E1E1E] rounded-3xl shadow-2xl border border-gray-800 p-8 text-center space-y-6 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-yellow-950/60 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto border border-yellow-800/40">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-950/60 px-2.5 py-1 rounded-full border border-yellow-800">
                    403 Forbidden • Courier Only
                  </span>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Rider Privileges Required</h2>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    The <strong>Logistics Dispatch & Route Manager</strong> is restricted to verified dispatch couriers.
                  </p>
                  {state.currentUser ? (
                    <div className="p-3 bg-[#161616] rounded-xl border border-gray-800 text-left text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Current User:</span>
                        <strong className="text-gray-200 font-mono">{state.currentUser.email}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Assigned Role:</span>
                        <span className="uppercase text-gray-300 font-bold font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                          {state.currentUser.role}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Please sign in with authorized rider credentials.
                    </p>
                  )}
                </div>
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={() => setActivePortal('customer')}
                    className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Customer Storefront
                  </button>
                  {state.currentUser && (
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
