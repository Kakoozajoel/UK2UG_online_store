import { useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPortal } from './components/AdminPortal';
import { DriverPortal } from './components/DriverPortal';
import { ShieldAlert, ArrowLeft, Clock } from 'lucide-react';
import { Modal } from './components/CommonUI';
import { ADMIN_UID } from './types';
import { isAdminUser, isRiderUser } from './lib/rbac';

export default function App() {
  const state = useAppState();
  const [openAuthModal, setOpenAuthModal] = useState<boolean>(false);
  
  // Active portal defaults to session role if present on reload so admin remains on admin without redirect
  const [activePortal, setActivePortal] = useState<'customer' | 'admin' | 'driver'>(() => {
    try {
      const stored = sessionStorage.getItem('uk2ug_session_user');
      const lastActive = Number(sessionStorage.getItem('uk2ug_session_last_active'));
      const isExpired = lastActive && (Date.now() - lastActive >= 20 * 60 * 1000);
      if (stored && !isExpired) {
        const u = JSON.parse(stored);
        if (isAdminUser(u?.email, u?.uid) || u?.role === 'admin') return 'admin';
        if (isRiderUser(u?.email) || u?.role === 'driver') return 'driver';
      }
    } catch {}
    return 'customer';
  });

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
            markAllNotificationsAsRead={state.markAllNotificationsAsRead}
            clearAllNotifications={state.clearAllNotifications}
            deleteNotification={state.deleteNotification}
            updateOrderPaymentDetails={state.updateOrderPaymentDetails}
            onNavigateToAdmin={() => setActivePortal('admin')}
            onNavigateToRider={() => setActivePortal('driver')}
            openAuthModal={openAuthModal}
            initialAuthEmail={state.timedOutEmail || ''}
            onAuthModalClosed={() => setOpenAuthModal(false)}
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
              onNavigateToStorefront={() => setActivePortal('customer')}
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
              onNavigateToStorefront={() => setActivePortal('customer')}
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

      {/* 20-minute Inactivity Session Expired Modal (No timer visible before expiration) */}
      {state.sessionTimedOut && (
        <Modal
          isOpen={state.sessionTimedOut}
          onClose={() => state.dismissSessionTimeout()}
          title="Session Expired"
          maxWidth="sm"
        >
          <div className="text-center p-6 space-y-5" id="uk2ug-session-timeout-modal">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Inactivity Timeout (20 min)
              </span>
              <h3 className="text-lg font-bold text-gray-900">Session Timed Out</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your screen was inactive for <strong>20 minutes</strong>. To protect your account and store security, your session has expired.
              </p>
              {state.timedOutEmail && (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                  Account: <strong className="font-mono text-gray-900">{state.timedOutEmail}</strong>
                </div>
              )}
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  state.dismissSessionTimeout();
                  setActivePortal('customer');
                  setOpenAuthModal(true);
                }}
                className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                Sign In Again to Continue
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
