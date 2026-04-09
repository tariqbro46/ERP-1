import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
              <span className="text-background font-bold">E</span>
            </div>
            <span className="text-lg font-bold uppercase tracking-tighter">ERP System</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to App
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pt-2 pb-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-border flex flex-col gap-4">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-foreground text-background rounded-xl text-center font-bold flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to App
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 text-center font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-foreground text-background rounded-xl text-center font-bold"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
