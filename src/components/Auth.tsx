import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { erpService } from '../services/erpService';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Loader2, KeyRound, Building2 } from 'lucide-react';

export const Login: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (showReset) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-amber-50 rounded-full">
            <KeyRound className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Reset Password</h2>
        <p className="text-gray-600 text-center mb-8">Enter your email to receive a password reset link.</p>
        
        {resetSent ? (
          <div className="p-4 bg-emerald-50 text-emerald-700 text-center rounded-xl border border-emerald-100 mb-6">
            Reset link sent! Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="your@email.com"
                required
              />
            </div>
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </button>
          </form>
        )}
        
        <button 
          onClick={() => setShowReset(false)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          Back to Login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100"
    >
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-indigo-50 rounded-full">
          <LogIn className="w-8 h-8 text-indigo-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Welcome Back</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <button 
              type="button"
              onClick={() => setShowReset(true)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button 
          onClick={onToggle}
          className="text-indigo-600 font-semibold hover:underline"
        >
          Create one
        </button>
      </div>
    </motion.div>
  );
};

export const Register: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // New Fields
  const [slogan, setSlogan] = useState('');
  const [address, setAddress] = useState('');
  const [financialYearStart, setFinancialYearStart] = useState('2024-04-01');
  const [currencySymbol, setCurrencySymbol] = useState('৳');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [printHeader, setPrintHeader] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [printFooter, setPrintFooter] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create Company
      const companyRef = doc(collection(db, 'companies'));
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 14); // 14 days trial

      await setDoc(companyRef, {
        id: companyRef.id,
        name: companyName,
        slogan,
        address,
        phone: contactPhone,
        email: contactEmail || email,
        website: websiteUrl,
        ownerId: user.uid,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        subscriptionStatus: 'trial',
        planType: 'free',
        expiryDate: trialExpiry.toISOString(),
        isAccessEnabled: true
      });

      // 3. Create User Profile
      const isFounder = email === 'sapientman46@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || email.split('@')[0],
        companyId: companyRef.id,
        role: isFounder ? 'Founder' : 'Admin',
        createdAt: serverTimestamp()
      });

      // 4. Create Settings
      await setDoc(doc(db, 'settings', companyRef.id), {
        companyId: companyRef.id,
        companyName,
        slogan: slogan || 'Enterprise ERP Solution',
        companyAddress: address,
        financialYearStart,
        baseCurrencySymbol: currencySymbol,
        timezone,
        printHeader: printHeader || companyName,
        printPhone: contactPhone,
        printEmail: contactEmail || email,
        printWebsite: websiteUrl,
        printFooter: printFooter,
        showPrintHeader: true,
        showPrintPhone: true,
        showPrintEmail: true,
        showPrintWebsite: !!websiteUrl,
        showPrintFooter: true,
        updatedAt: serverTimestamp()
      });

      // 5. Create Default Ledgers
      const groups = await erpService.seedDefaultGroups(companyRef.id);
      const getGroupId = (name: string) => groups.find(g => g.name === name)?.id;

      const defaultLedgers = [
        { name: 'Sales A/c', group_id: getGroupId('Sales Accounts'), opening_balance: 0 },
        { name: 'Purchase A/c', group_id: getGroupId('Purchase Accounts'), opening_balance: 0 },
        { name: 'Cash', group_id: getGroupId('Cash-in-Hand'), opening_balance: 0 },
        { name: 'Bank', group_id: getGroupId('Bank Accounts'), opening_balance: 0 },
        { name: 'Profit & Loss A/c', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
        { name: 'Bad Debts', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
        { name: 'Management Cost', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
        { name: 'Utility Bill', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
      ];

      for (const ledger of defaultLedgers) {
        if (ledger.group_id) {
          await erpService.createLedger(companyRef.id, ledger);
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl w-full mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100"
    >
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-emerald-50 rounded-full">
          <UserPlus className="w-8 h-8 text-emerald-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
      <p className="text-center text-gray-500 mb-8 text-sm">Step {step} of 3</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Account Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                placeholder="Full Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Company Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="Your Business Name"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Slogan</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g. Quality first"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Full business address"
                rows={2}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year Start</label>
                <input
                  type="date"
                  value={financialYearStart}
                  onChange={(e) => setFinancialYearStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="৳"
                  required
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Print & Regional Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="+880..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL (Optional)</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="www.example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Print Header</label>
              <input
                type="text"
                value={printHeader}
                onChange={(e) => setPrintHeader(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                placeholder="Header text for invoices"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Print Footer</label>
              <input
                type="text"
                value={printFooter}
                onChange={(e) => setPrintFooter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                placeholder="Footer text for invoices"
              />
            </div>
          </motion.div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 3 ? "Complete Registration" : "Next Step")}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button 
          onClick={onToggle}
          className="text-emerald-600 font-semibold hover:underline"
        >
          Sign in
        </button>
      </div>
    </motion.div>
  );
};
