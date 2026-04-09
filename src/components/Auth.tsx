import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { erpService } from '../services/erpService';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const navigate = useNavigate();
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
      <div className="min-h-screen w-full flex bg-background">
        <div className="hidden lg:block lg:w-[40%] relative overflow-hidden">
          <img 
            src="https://picsum.photos/seed/auth-bg/1200/1600" 
            alt="Auth Background" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Recover your account.</h2>
            <p className="text-lg opacity-80">Don't worry, it happens to the best of us.</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-20 relative">
          <button 
            onClick={() => setShowReset(false)}
            className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>

          <div className="max-w-md w-full mx-auto my-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
              <p className="text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            {resetSent ? (
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center">
                <p className="text-sm font-medium mb-6">A password reset link has been sent to your email address.</p>
                <button 
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="w-full py-4 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                {error && <p className="text-sm text-rose-500 flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4" /> {error}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Image (Dribbble Style) */}
      <div className="hidden lg:block lg:w-[40%] relative overflow-hidden">
        <img 
          src="https://picsum.photos/seed/dribbble-login/1200/1600" 
          alt="Auth Background" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Streamline your business operations.</h2>
          <p className="text-lg opacity-80 font-medium">The most powerful ERP solution for modern enterprises.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-20 relative">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="max-w-md w-full mx-auto my-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">Sign in to ERP System</h1>
            <p className="text-muted-foreground">Enter your details below to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                <button 
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-sm text-rose-500 flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4" /> {error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button 
                onClick={onToggle}
                className="font-bold text-foreground hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Register: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const companyRef = doc(collection(db, 'companies'));
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 14);

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

      const isFounder = email === 'sapientman46@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || email.split('@')[0],
        companyId: companyRef.id,
        role: isFounder ? 'Founder' : 'Admin',
        createdAt: serverTimestamp()
      });

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
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-[40%] relative overflow-hidden">
        <img 
          src="https://picsum.photos/seed/dribbble-reg/1200/1600" 
          alt="Auth Background" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Join the future of ERP.</h2>
          <p className="text-lg opacity-80 font-medium">Create your account and start managing your business today.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-20 relative overflow-y-auto">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="max-w-md w-full mx-auto my-auto py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">Create your Account</h1>
            <p className="text-muted-foreground">Step {step} of 3: {step === 1 ? 'Personal Details' : step === 2 ? 'Company Details' : 'Final Configuration'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Use 8 or more characters with a mix of letters, numbers & symbols.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company Slogan</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Innovating the future"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    placeholder="123 Business St, City"
                    rows={2}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">FY Start</label>
                    <input
                      type="date"
                      value={financialYearStart}
                      onChange={(e) => setFinancialYearStart(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Currency</label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="৳"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="+880..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Website</label>
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Print Header</label>
                  <input
                    type="text"
                    value={printHeader}
                    onChange={(e) => setPrintHeader(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Company Name Ltd."
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-rose-500 flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4" /> {error}</p>}

            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-4 border border-border rounded-xl font-bold hover:bg-foreground/5 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 3 ? "Complete Registration" : "Next Step")}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button 
                onClick={onToggle}
                className="font-bold text-foreground hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
