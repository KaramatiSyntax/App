"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlert } from "@/components/AlertProvider";
import { Loader2, X, HelpCircle } from "lucide-react";


function Spinner() {
  return <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />;
}



export default function WalletPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1); // 1: QR, 2: Upload
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const fileInput = useRef();
  const { showSuccessAlert, showErrorAlert, showWarningAlert, showInfoAlert } = useAlert();
  const [showTutorial, setShowTutorial] = useState(false);
  const verificationSteps = [
    'Uploading screenshot...',
    'Checking image size...',
    'Checking by OCR...',
    'Verifying with AI...',
    'Checking recipient name...',
    'Checking date...',
    'Validating amount...',
    'Completion in face...',
    'Finalizing verification...'
  ];

  async function fetchUserDataAndWallet() {
    setLoading(true);
    try {
      // Fetch user data from cookies using /api/users/me
      const res = await fetch('/api/users/me');
      
      if (res.status === 401) {
        // User not authenticated
        showErrorAlert("Authentication Required", "Please log in to access your wallet.");
        setUserData(null);
        setBalance(0);
        setHistory([]);
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await res.json();
      const user = data.user;
      
      if (user) {
        setUserData(user);
        setBalance(user.coins || 0);
        
        // Fetch withdrawal history using user's email
        const hres = await fetch(`/api/withdraws?userEmail=${user.email}&limit=50`);
        if (hres.ok) {
          const withdrawalHistory = await hres.json();
          setHistory(Array.isArray(withdrawalHistory) ? withdrawalHistory : []);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showErrorAlert("Error", "Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Load user data on mount
  useEffect(() => {
    fetchUserDataAndWallet();
  }, []);

  React.useEffect(() => {
    let interval;
    if (isVerifying) {
      setProgress(0);
      setProgressStep(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + 100 / verificationSteps.length;
        });
        setProgressStep((prev) => {
          if (prev >= verificationSteps.length - 1) return prev;
          return prev + 1;
        });
      }, 500);
    } else {
      setProgress(0);
      setProgressStep(0);
    }
    return () => clearInterval(interval);
  }, [isVerifying]);

  async function handleAdd(e) {
    e.preventDefault();
    setAlert("");
    setSuccess("");
    if (!screenshot) return setAlert("Please upload a payment screenshot.");
    if (!userData?.email) {
      showErrorAlert("Error", "User data not found. Please reload the page.");
      return;
    }
    
    // Debug logging
    console.log("handleAdd - userData:", userData);
    console.log("handleAdd - screenshot:", screenshot);
    console.log("handleAdd - userEmail:", userData.email);
    
    // Additional validation
    if (!userData.email || !screenshot) {
      console.error("Missing required fields:", { userEmail: userData.email, screenshot: !!screenshot });
      showErrorAlert("Error", "Missing required fields. Please try again.");
      return;
    }
    
    setLoading(true);
    setIsVerifying(true);
    setStep(3);
    const formData = new FormData();
    formData.append("userEmail", userData.email);
    formData.append("screenshot", screenshot);
    
    // Debug: Log form data
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    try {
      const res = await fetch("/api/wallet/add", { method: "POST", body: formData });
      console.log("API Response status:", res.status);
      const data = await res.json();
      console.log("API Response data:", data);
      setLoading(false);
      setIsVerifying(false);
      
      if (res.ok) {
        showSuccessAlert("Coins Added!", "Coins added successfully!");
        await fetchUserDataAndWallet();
        setAddOpen(false);
        setScreenshot(null);
        setStep(1);
      } else {
        showErrorAlert("Add Coins Failed", data.error || "Failed to add coins.");
        if (data.snoozeReason) setAlert(`${data.error}: ${data.snoozeReason}`);
        if (data.retryCount >= 3 && data.snoozeExpiry) setAlert(`Account snoozed until ${new Date(data.snoozeExpiry).toLocaleString()}`);
        setStep(2);
      }
    } catch (err) {
      console.error("handleAdd error:", err);
      setIsVerifying(false);
      showErrorAlert("Network Error", "Network error. Please try again.");
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setAlert("");
    setSuccess("");
    if (!amount || !upiId) return setAlert("Enter amount and UPI ID.");
    if (!userData?.email) {
      showErrorAlert("Error", "User data not found. Please reload the page.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/withdraws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: userData.email,
          upiId: upiId,
          withdrawAmount: Number(amount)
        })
      });
      const data = await res.json();
      setLoading(false);
      
      if (res.ok) {
        showSuccessAlert("Withdrawal Request Submitted!", "Your withdrawal request has been submitted and coins have been deducted from your wallet.");
        await fetchUserDataAndWallet();
        setWithdrawOpen(false);
        setAmount("");
        setUpiId("");
      } else {
        showErrorAlert("Withdraw Failed", data.error || "Failed to withdraw.");
        if (data.snoozeReason) setAlert(`${data.error}: ${data.snoozeReason}`);
        if (data.retryCount >= 3 && data.snoozeExpiry) setAlert(`Account snoozed until ${new Date(data.snoozeExpiry).toLocaleString()}`);
      }
    } catch (err) {
      showErrorAlert("Network Error", "Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {loading && !userData && (
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-blue-700 dark:text-cyan-300">Loading wallet...</p>
            </div>
          </div>
        )}
        {!loading && !userData && (
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <h2 className="text-xl font-bold text-blue-700 dark:text-cyan-300 mb-4">Authentication Required</h2>
              <p className="text-blue-600 dark:text-cyan-200">Please log in to access your wallet.</p>
            </div>
          </div>
        )}
        {userData && (
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md sm:max-w-lg bg-white/10 dark:bg-white/10 dark:backdrop-blur-xl dark:border dark:border-white/20 rounded-2xl shadow-lg p-3 sm:p-6 mt-4 sm:mt-8 text-blue-900 dark:text-white">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-white mb-2">Wallet</h1>
          <div className="text-sm text-blue-600 dark:text-cyan-300 mb-4">
            Welcome, {userData.username || userData.email}
          </div>
          <div className="text-4xl font-extrabold text-blue-500 dark:text-cyan-300 mb-4">₹{balance}</div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setAddOpen(true); setStep(1); setScreenshot(null); setAlert(""); setSuccess(""); }} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-cyan-500 dark:to-cyan-600 text-white font-bold hover:from-blue-600 hover:to-blue-700 dark:hover:from-cyan-600 dark:hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" disabled={loading}>Add Coins</button>
            <button onClick={() => setWithdrawOpen(true)} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 dark:from-emerald-500 dark:to-emerald-600 text-white font-bold hover:from-green-600 hover:to-green-700 dark:hover:from-emerald-600 dark:hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" disabled={loading}>Withdraw</button>
          </div>
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center gap-2 text-blue-400 dark:text-cyan-300 hover:text-blue-300 dark:hover:text-cyan-200 cursor-pointer text-sm font-medium transition-colors duration-200"
              onClick={() => setShowTutorial(true)}
            >
              <HelpCircle className="w-4 h-4" />
              Watch Tutorial
            </div>
          </div>
          <h2 className="text-lg font-semibold text-blue-700 dark:text-cyan-200 mb-2">Withdrawal History</h2>
          <div className="max-h-64 overflow-y-auto divide-y divide-blue-100 dark:divide-white/10 mb-2">
            {history.length === 0 && <div className="text-blue-400 dark:text-cyan-300 text-center py-4">No withdrawals yet.</div>}
            {history.map((h) => (
              <motion.div key={h._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`py-3 px-2 rounded-xl mb-2 border-2 ${h.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700' : h.status === 'approved' ? 'bg-green-50 dark:bg-emerald-900/10 border-green-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg text-blue-700 dark:text-cyan-200">₹{h.withdrawAmount}</span>
                  <span className={`text-xs px-2 py-1 rounded ${h.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200' : h.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'}`}>{h.status}</span>
            </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-xs text-blue-900 dark:text-cyan-100">
                  <div><span className="font-semibold">UPI:</span> <span className="font-mono">{h.upiId}</span></div>
                  <div><span className="font-semibold">Date:</span> {new Date(h.createdAt).toLocaleString()}</div>
                  {h.adminNotes && <div className="text-orange-500 dark:text-orange-300"><span className="font-semibold">Note:</span> {h.adminNotes}</div>}
          </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        )}

      {/* Add Coins Modal */}
      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-10"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setAddOpen(false); setAlert(""); setSuccess(""); setScreenshot(null); setStep(1);
              }
            }}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white/10 dark:bg-white/10 dark:backdrop-blur-xl dark:border dark:border-white/20 rounded-xl p-2 text-xs sm:p-4 sm:text-sm w-full max-w-xs sm:max-w-sm shadow-xl flex flex-col gap-3 text-blue-900 dark:text-white">
              {step === 1 && (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-blue-700 dark:text-cyan-200 mb-1 sm:mb-2">Step 1: Download QR and Pay</h2>
                  <img 
                    src="/qr-code.jpeg" 
                    alt="UPI QR" 
                    className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-lg border dark:border-white/20 mb-2" 
                    onError={(e) => {
                      console.error('Failed to load QR code image');
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="text-xs text-center text-blue-500 dark:text-cyan-300 mb-2">Download this QR code and scan it with any UPI app to make payment.</div>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/qr-code.jpeg';
                      link.download = 'turrani-esports-qr.jpeg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="block w-full text-center py-2 rounded font-bold text-white mb-2 shadow-lg transition-all duration-200 text-base sm:text-lg"
                    style={{ background: '#4F47C3', boxShadow: '0 2px 8px #4F47C340' }}
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-2 rounded font-semibold transition-all duration-200 text-blue-700 dark:text-cyan-200 hover:bg-blue-100 dark:hover:bg-cyan-900/20 cursor-pointer text-base sm:text-lg"
                  >
                    I have paid
                  </button>
                </>
              )}
              {step === 2 && (
                <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-blue-700 dark:text-cyan-200">Step 2: Take Screenshot and Verify</h2>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInput} 
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          setAlert("Please select an image file.");
                          return;
                        }
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          setAlert("File size too large. Please select an image smaller than 5MB.");
                          return;
                        }
                        setScreenshot(file);
                        setAlert("");
                      }
                    }} 
                    className="border p-2 rounded dark:bg-white/10 dark:border-white/20 text-xs sm:text-sm" 
                    required 
                  />
                  {!screenshot && <div className="text-xs text-blue-500 dark:text-cyan-300">Please select a payment screenshot</div>}
                  {screenshot && <img src={URL.createObjectURL(screenshot)} alt="Preview" className="w-full h-24 sm:h-32 object-contain rounded border dark:border-white/20" />}
                  {alert && <div className="text-red-500 dark:text-red-300 text-xs sm:text-sm">{alert}</div>}
                  {success && <div className="text-green-600 dark:text-green-300 text-xs sm:text-sm">{success}</div>}
                  <button 
                    type="submit" 
                    disabled={loading || !screenshot} 
                    className="py-2 rounded bg-blue-500 dark:bg-cyan-600 text-white font-semibold hover:bg-blue-600 dark:hover:bg-cyan-700 transition flex items-center justify-center text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Spinner /> : "Submit"}
                  </button>
                  {/* Cancel button removed */}
                </form>
              )}
              {step === 3 && isVerifying && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                    <div className="text-center text-white py-10 flex flex-col items-center gap-3">
                      <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden border border-white/20 mb-1">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs sm:text-sm font-medium animate-pulse text-white/70">
                        {verificationSteps[progressStep]}
                      </div>
                      <Loader2 className="mx-auto animate-spin mt-2 text-blue-400 w-5 h-5" />
                    </div>
                </motion.div>
              )}
              {step === 3 && !isVerifying && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold text-blue-700 dark:text-cyan-200">Verification Result</h2>
                  <p className="text-blue-900 dark:text-cyan-100">
                    {isVerifying ? "Verifying screenshot..." : "Screenshot verified successfully!"}
                  </p>
                  <button type="button" onClick={() => { setAddOpen(false); setAlert(""); setSuccess(""); setScreenshot(null); setStep(1); }} className="text-blue-400 dark:text-cyan-300 hover:underline">Back to Add Coins</button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Withdraw Modal */}
      <AnimatePresence>
        {withdrawOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-10">
            <motion.form initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onSubmit={handleWithdraw} className="bg-white/10 dark:bg-white/10 dark:backdrop-blur-xl dark:border dark:border-white/20 rounded-xl p-2 text-xs sm:p-4 sm:text-sm w-full max-w-xs sm:max-w-sm shadow-xl flex flex-col gap-4 text-blue-900 dark:text-white">
              <h2 className="text-xl font-bold text-green-700 dark:text-emerald-300">Withdraw</h2>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Amount"
                className="border p-2 rounded dark:bg-white/10 dark:border-white/20 appearance-none focus:outline-none"
                autoComplete="off"
                min="1"
                max={balance}
              />
              {amount && Number(amount) > 0 && Number(amount) < 25 && (
                <div className="text-green-600 dark:text-green-300 text-sm font-semibold mb-1">Minimum withdraw amount is ₹25.</div>
              )}
              {amount && Number(amount) > balance && (
                <div className="text-red-600 dark:text-red-400 text-sm font-semibold mb-1">Insufficient balance.</div>
              )}
              <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="Your UPI ID (e.g. user@upi)" className="border p-2 rounded dark:bg-white/10 dark:border-white/20" required />
              {alert && <div className="text-red-500 dark:text-red-300 text-sm">{alert}</div>}
              {success && <div className="text-green-600 dark:text-green-300 text-sm">{success}</div>}
              <button type="submit" disabled={loading || Number(amount) < 25 || Number(amount) > balance} className="py-2 rounded bg-green-500 dark:bg-emerald-600 text-white font-semibold hover:bg-green-600 dark:hover:bg-emerald-700 transition flex items-center justify-center">
                {loading ? <Spinner /> : "Submit"}
              </button>
              <button type="button" onClick={() => { setWithdrawOpen(false); setAlert(""); setSuccess(""); setAmount(""); setUpiId(""); }} className="text-green-400 dark:text-emerald-300 hover:underline">Cancel</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video Container */}
              <div className="relative">
                <video
                  src="/wallet.mp4"
                  title="Tutorial Video"
                  className="rounded-2xl cursor-pointer"
                  controls
                  playsInline
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    width: 'auto',
                    height: 'auto'
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}