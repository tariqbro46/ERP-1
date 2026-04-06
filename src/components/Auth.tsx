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
import { LogIn, UserPlus, Loader2, KeyRound, Building2, AlertCircle, Users, ChevronLeft } from 'lucide-react';

export const Login: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStep('password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Wrong password. Try again or click Forgot password to reset it.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Could not find your Account');
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white sm:bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[450px] bg-white sm:border border-gray-200 rounded-lg p-6 sm:p-10 sm:shadow-sm"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-2xl font-medium tracking-tight text-[#4285F4]">G</span>
              <span className="text-2xl font-medium tracking-tight text-[#EA4335]">o</span>
              <span className="text-2xl font-medium tracking-tight text-[#FBBC05]">o</span>
              <span className="text-2xl font-medium tracking-tight text-[#4285F4]">g</span>
              <span className="text-2xl font-medium tracking-tight text-[#34A853]">l</span>
              <span className="text-2xl font-medium tracking-tight text-[#EA4335]">e</span>
            </div>
            <h1 className="text-2xl font-normal text-gray-900 mb-2">Account recovery</h1>
            <p className="text-base text-gray-700 text-center">To help keep your account safe, Google wants to make sure it’s really you</p>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-lg mb-6 text-sm">
                A password reset link has been sent to your email address.
              </div>
              <button 
                onClick={() => { setShowReset(false); setResetSent(false); }}
                className="text-[#1a73e8] font-medium hover:bg-blue-50 px-4 py-2 rounded transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="relative">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                  placeholder="Email"
                  id="reset-email"
                  required
                />
                <label 
                  htmlFor="reset-email"
                  className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Email
                </label>
              </div>
              {error && <p className="text-sm text-[#d93025] flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
        
        <div className="mt-6 flex gap-6 text-xs text-gray-500">
          <button className="hover:underline">English (United States)</button>
          <div className="flex gap-4">
            <button className="hover:underline">Help</button>
            <button className="hover:underline">Privacy</button>
            <button className="hover:underline">Terms</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white sm:bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] bg-white sm:border border-gray-200 rounded-lg p-6 sm:p-10 sm:shadow-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-1 mb-3">
            <span className="text-2xl font-medium tracking-tight text-[#4285F4]">G</span>
            <span className="text-2xl font-medium tracking-tight text-[#EA4335]">o</span>
            <span className="text-2xl font-medium tracking-tight text-[#FBBC05]">o</span>
            <span className="text-2xl font-medium tracking-tight text-[#4285F4]">g</span>
            <span className="text-2xl font-medium tracking-tight text-[#34A853]">l</span>
            <span className="text-2xl font-medium tracking-tight text-[#EA4335]">e</span>
          </div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Sign in</h1>
          <p className="text-base text-gray-700">Use your Google Account</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleNext} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                placeholder="Email or phone"
                id="email"
                required
              />
              <label 
                htmlFor="email"
                className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
              >
                Email or phone
              </label>
            </div>
            
            <button type="button" className="text-[#1a73e8] text-sm font-medium hover:underline">Forgot email?</button>
            
            <div className="text-sm text-gray-600 leading-relaxed">
              Not your computer? Use Guest mode to sign in privately.{' '}
              <button type="button" className="text-[#1a73e8] font-medium hover:underline">Learn more</button>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button 
                type="button"
                onClick={onToggle}
                className="text-[#1a73e8] font-medium hover:bg-blue-50 px-4 py-2 rounded transition-colors"
              >
                Create account
              </button>
              <button
                type="submit"
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-full w-fit mb-6">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-3 h-3 text-gray-500" />
              </div>
              <span className="text-sm text-gray-700 pr-2">{email}</span>
              <button 
                type="button" 
                onClick={() => setStep('email')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                placeholder="Enter your password"
                id="password"
                autoFocus
                required
              />
              <label 
                htmlFor="password"
                className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
              >
                Enter your password
              </label>
            </div>

            {error && <p className="text-sm text-[#d93025] flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

            <div className="flex items-center gap-2">
              <input type="checkbox" id="show-password" title="Show password" />
              <label htmlFor="show-password" className="text-sm text-gray-700">Show password</label>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button 
                type="button"
                onClick={() => setShowReset(true)}
                className="text-[#1a73e8] font-medium hover:bg-blue-50 px-4 py-2 rounded transition-colors"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      <div className="mt-6 flex gap-6 text-xs text-gray-500">
        <button className="hover:underline">English (United States)</button>
        <div className="flex gap-4">
          <button className="hover:underline">Help</button>
          <button className="hover:underline">Privacy</button>
          <button className="hover:underline">Terms</button>
        </div>
      </div>
    </div>
  );
};export const Register: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
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
        setError('Email/Password authentication is not enabled in Firebase Console.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white sm:bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[600px] bg-white sm:border border-gray-200 rounded-lg p-6 sm:p-10 sm:shadow-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-1 mb-3">
            <span className="text-2xl font-medium tracking-tight text-[#4285F4]">G</span>
            <span className="text-2xl font-medium tracking-tight text-[#EA4335]">o</span>
            <span className="text-2xl font-medium tracking-tight text-[#FBBC05]">o</span>
            <span className="text-2xl font-medium tracking-tight text-[#4285F4]">g</span>
            <span className="text-2xl font-medium tracking-tight text-[#34A853]">l</span>
            <span className="text-2xl font-medium tracking-tight text-[#EA4335]">e</span>
          </div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Create your Account</h1>
          <p className="text-base text-gray-700">Step {step} of 3</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="First name"
                    id="first-name"
                    required
                  />
                  <label htmlFor="first-name" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">First name</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="Last name (optional)"
                    id="last-name"
                  />
                  <label htmlFor="last-name" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Last name (optional)</label>
                </div>
              </div>

              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                  placeholder="Username"
                  id="reg-email"
                  required
                />
                <label htmlFor="reg-email" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Username</label>
                <span className="absolute right-4 top-3.5 text-sm text-gray-500">@gmail.com</span>
              </div>
              <p className="text-xs text-gray-600">You can use letters, numbers & periods</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="Password"
                    id="reg-password"
                    required
                  />
                  <label htmlFor="reg-password" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Password</label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="Confirm"
                    id="confirm-password"
                    required
                  />
                  <label htmlFor="confirm-password" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Confirm</label>
                </div>
              </div>
              <p className="text-xs text-gray-600">Use 8 or more characters with a mix of letters, numbers & symbols</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
                <label htmlFor="company-name" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Company Name</label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                  placeholder="Company Slogan"
                  id="slogan"
                />
                <label htmlFor="slogan" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Company Slogan</label>
              </div>
              <div className="relative">
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent resize-none"
                  placeholder="Company Address"
                  id="address"
                  rows={2}
                  required
                />
                <label htmlFor="address" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Company Address</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="date"
                    value={financialYearStart}
                    onChange={(e) => setFinancialYearStart(e.target.value)}
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer"
                    id="fy-start"
                    required
                  />
                  <label htmlFor="fy-start" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8]">Financial Year Start</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="Currency Symbol"
                    id="currency"
                    required
                  />
                  <label htmlFor="currency" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Currency Symbol</label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all"
                  id="timezone"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                </select>
                <label htmlFor="timezone" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8]">Timezone</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="Contact Phone"
                    id="phone"
                  />
                  <label htmlFor="phone" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Contact Phone</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                    placeholder="Website URL"
                    id="website"
                  />
                  <label htmlFor="website" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Website URL</label>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={printHeader}
                  onChange={(e) => setPrintHeader(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                  placeholder="Print Header"
                  id="header"
                />
                <label htmlFor="header" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Print Header</label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={printFooter}
                  onChange={(e) => setPrintFooter(e.target.value)}
                  className="w-full px-4 py-3.5 rounded border border-gray-300 focus:border-2 focus:border-[#1a73e8] outline-none transition-all peer placeholder-transparent"
                  placeholder="Print Footer"
                  id="footer"
                />
                <label htmlFor="footer" className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]">Print Footer</label>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-[#d93025] flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

          <div className="flex justify-between items-center pt-4">
            <button 
              type="button"
              onClick={onToggle}
              className="text-[#1a73e8] font-medium hover:bg-blue-50 px-4 py-2 rounded transition-colors"
            >
              Sign in instead
            </button>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-[#1a73e8] font-medium hover:bg-blue-50 px-4 py-2 rounded transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 3 ? "Complete" : "Next")}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      <div className="mt-6 flex gap-6 text-xs text-gray-500">
        <button className="hover:underline">English (United States)</button>
        <div className="flex gap-4">
          <button className="hover:underline">Help</button>
          <button className="hover:underline">Privacy</button>
          <button className="hover:underline">Terms</button>
        </div>
      </div>
    </div>
  );
};
