"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlert } from "@/components/AlertProvider";
import { AlertTriangle, Loader2, X, HelpCircle } from "lucide-react";


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
        showErrorAlert("Please log in to access your wallet.");
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
        setBalance(user.coins || "not found");

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

  const isSnoozed = userData?.isSnoozed && new Date(userData.snoozeExpiry) > new Date();

  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
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
          <motion.div 
            initial={{ y: -30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6 mt-4 sm:mt-8 text-gray-900 dark:text-white"
          >
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">My Wallet</h1>
            <div className="text-4xl font-extrabold text-blue-600 dark:text-cyan-400 mb-4">₹{balance}</div>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => { 
                  if (!isSnoozed) { 
                    setAddOpen(true); 
                    setStep(1); 
                    setScreenshot(null); 
                    setAlert(""); 
                    setSuccess(""); 
                  }
                }} 
                className={`flex-1 py-3 rounded-lg text-white font-bold transition-all duration-200 shadow-lg transform hover:scale-105
                  ${isSnoozed ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-cyan-500 dark:to-cyan-600 hover:from-blue-600 hover:to-blue-700 dark:hover:from-cyan-600 dark:hover:to-cyan-700'}
                `} 
                disabled={loading || isSnoozed}
              >
                Add Coins
              </button>
              <button 
                onClick={() => { 
                  if (!isSnoozed) {
                    setWithdrawOpen(true);
                  }
                }} 
                className={`flex-1 py-3 rounded-lg text-white font-bold transition-all duration-200 shadow-lg transform hover:scale-105
                  ${isSnoozed ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 dark:from-emerald-500 dark:to-emerald-600 hover:from-green-600 hover:to-green-700 dark:hover:from-emerald-600 dark:hover:to-emerald-700'}
                `} 
                disabled={loading || isSnoozed}
              >
                Withdraw
              </button>
            </div>
            
            {isSnoozed && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded-lg mb-4">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>
                  Your account is temporarily restricted due to multiple failed verification attempts. 
                  <span className="font-semibold">It will be unsnoozed on {new Date(userData.snoozeExpiry).toLocaleString()}.</span>
                </p>
              </div>
            )}
            
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-300 hover:text-blue-500 dark:hover:text-cyan-400 cursor-pointer text-sm font-medium transition-colors duration-200"
                onClick={() => setShowTutorial(true)}
              >
                <HelpCircle className="w-4 h-4" />
                Watch Tutorial
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Withdrawal History</h2>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 mb-2">
              {history.length === 0 && <div className="text-gray-400 text-center py-4">No withdrawals yet.</div>}
              {history.map((h) => (
                <motion.div key={h._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`py-3 px-2 rounded-xl mb-2 border ${h.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700' : h.status === 'approved' ? 'bg-green-50 dark:bg-emerald-900/10 border-green-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-lg text-gray-800 dark:text-white">₹{h.withdrawAmount}</span>
                    <span className={`text-xs px-2 py-1 rounded ${h.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200' : h.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'}`}>{h.status}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-xs text-gray-700 dark:text-gray-300">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4"
              onClick={e => {
                if (e.target === e.currentTarget) {
                  setAddOpen(false); setAlert(""); setSuccess(""); setScreenshot(null); setStep(1);
                }
              }}
            >
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-gray-900 dark:text-white">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 dark:text-white">Add Coins</h2>
                
                {step === 1 && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Step 1: Download QR and Pay</h3>
                    <img
                      src="/qr-code.jpeg"
                      alt="UPI QR"
                      className="w-40 h-40 mx-auto rounded-lg border border-gray-300 dark:border-gray-700 mb-2"
                      onError={(e) => {
                        console.error('Failed to load QR code image');
                        e.target.style.display = 'none';
                      }}
                    />
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">Scan this QR with any UPI app to make your payment.</p>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/qr-code.jpeg';
                        link.download = 'turrani-esports-qr.jpeg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors duration-200 shadow-md"
                    >
                      Download QR
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-3 rounded-lg text-blue-600 dark:text-cyan-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      I have paid
                    </button>
                  </>
                )}
                
                {step === 2 && (
                  <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Step 2: Upload Screenshot</h3>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInput}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          if (!file.type.startsWith('image/')) {
                            setAlert("Please select an image file.");
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setAlert("File size too large. Please select an image smaller than 5MB.");
                            return;
                          }
                          setScreenshot(file);
                          setAlert("");
                        }
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                      required
                    />
                    {!screenshot && <div className="text-sm text-gray-500 dark:text-gray-400">Please select a payment screenshot</div>}
                    {screenshot && <img src={URL.createObjectURL(screenshot)} alt="Preview" className="w-full max-h-48 object-contain rounded-lg border border-gray-300 dark:border-gray-700" />}
                    
                    {alert && <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{alert}</div>}
                    {success && <div className="text-sm text-green-600 dark:text-green-300">{success}</div>}
                    
                    <button
                      type="submit"
                      disabled={loading || !screenshot}
                      className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? <Spinner /> : "Verify & Add Coins"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-3 rounded-lg text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Back
                    </button>
                  </form>
                )}
                
                {step === 3 && isVerifying && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4 text-center"
                  >
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Verifying Payment...</h3>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-cyan-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium animate-pulse text-gray-500 dark:text-gray-400">
                      {verificationSteps[progressStep]}
                    </p>
                    <Loader2 className="mx-auto animate-spin text-blue-600 dark:text-cyan-400 w-6 h-6" />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Withdraw Modal */}
        <AnimatePresence>
          {withdrawOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
              <motion.form 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.9 }} 
                onSubmit={handleWithdraw} 
                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-gray-900 dark:text-white"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-center text-green-700 dark:text-emerald-300">Withdraw Coins</h2>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Amount"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                  min="1"
                  max={balance}
                />
                {amount && Number(amount) < 25 && (
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">Minimum withdraw amount is ₹25.</div>
                )}
                {amount && Number(amount) > balance && (
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">Insufficient balance.</div>
                )}
                <input 
                  type="text" 
                  value={upiId} 
                  onChange={e => setUpiId(e.target.value)} 
                  placeholder="Your UPI ID (e.g. user@upi)" 
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                  required 
                />
                
                {alert && <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{alert}</div>}
                
                <button 
                  type="submit" 
                  disabled={loading || Number(amount) < 25 || Number(amount) > balance} 
                  className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : "Submit Withdrawal"}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setWithdrawOpen(false); setAlert(""); setSuccess(""); setAmount(""); setUpiId(""); }} 
                  className="w-full py-3 rounded-lg text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
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