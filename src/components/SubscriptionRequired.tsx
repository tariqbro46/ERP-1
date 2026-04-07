import React from 'react';
import { motion } from 'motion/react';
import { Lock, CreditCard, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionRequired() {
  const { logout, company } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-8 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-rose-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
          <p className="text-muted-foreground">
            Your access to <strong>{company?.name}</strong> has been disabled or your subscription has expired.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Renew Subscription</p>
              <p className="text-xs text-muted-foreground">Contact our sales team to renew your monthly or yearly plan.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Support</p>
              <p className="text-xs text-muted-foreground">Reach out to sapientman46@gmail.com for assistance.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button 
            onClick={() => window.location.href = 'mailto:sapientman46@gmail.com'}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Contact Founder
          </button>
          <button 
            onClick={logout}
            className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
