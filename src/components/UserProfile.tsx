import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Briefcase, MapPin, AlignLeft, 
  Camera, Loader2, Save, ArrowLeft, CheckCircle2, CloudLightning,
  Globe, Info, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile data states
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');

  // Status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setDisplayName(data.displayName || '');
          setPhone(data.phone || '');
          setSecondaryPhone(data.secondaryPhone || '');
          setDesignation(data.designation || '');
          setDepartment(data.department || '');
          setCity(data.city || '');
          setStateName(data.state || '');
          setCountry(data.country || '');
          setAddress(data.address || '');
          setBio(data.bio || '');
          setProfilePic(data.photoURL || '');
        }
      } catch (err) {
        console.error('Failed loading extended profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Handle compression & upload of profile picture
  const handleProfilePicUpload = (file: File) => {
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const max_size = 180;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        try {
          setIsUploading(true);
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { photoURL: compressedBase64 });
          setProfilePic(compressedBase64);
          setSuccessMsg('Profile picture updated successfully!');
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          console.error('Failed uploading profile picture:', err);
          setErrorMsg('Failed to update profile picture. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProfilePicUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProfilePicUpload(e.dataTransfer.files[0]);
    }
  };

  // Save all profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        designation: designation.trim(),
        department: department.trim(),
        city: city.trim(),
        state: stateName.trim(),
        country: country.trim(),
        address: address.trim(),
        bio: bio.trim()
      });

      setSuccessMsg('Your profile has been saved successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error saving profile changes:', err);
      setErrorMsg('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">Loading Profile Credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-background">
      
      {/* Main Form Area (Scrollable body below) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Notification Messages */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <CloudLightning className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Elegant Banner Header Card with Profile Picture upload */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative">
              <div className="h-28 bg-linear-to-r from-primary/30 to-blue-500/10 relative" />
              
              <div className="p-5 pt-0 flex flex-col sm:flex-row sm:items-end gap-5 relative -mt-10">
                
                {/* Photo Drag/Drop Box */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-md group/avatar cursor-pointer",
                    dragActive ? "border-primary" : "border-card"
                  )}
                  onClick={() => document.getElementById('profile-file-uploader')?.click()}
                  title="Click to change or drag photo here"
                >
                  <input 
                    type="file" 
                    id="profile-file-uploader" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  {isUploading ? (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <img 
                        src={profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                        alt="Profile avatar" 
                        className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[9px] font-bold">
                        <Camera className="w-4 h-4 mb-1" />
                        <span>UPLOAD</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                    <span>{user?.displayName || 'User profile'}</span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-500 text-white font-mono">
                      {user?.role || 'Staff'}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user?.email}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 font-mono uppercase tracking-widest">
                    Authorized session linked to Workspace
                  </p>
                </div>
              </div>

              {dragActive && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-xs border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-50">
                  <div className="text-center space-y-1">
                    <Camera className="w-8 h-8 animate-bounce text-primary mx-auto" />
                    <p className="text-xs font-bold text-primary">Drop profile image here to upload</p>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Layout of fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card Section: Personal Parameters */}
              <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <User className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Personal details</h4>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="w-full h-9 bg-background border border-border rounded-lg pl-3 pr-8 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                        placeholder="e.g. John Doe"
                      />
                      <User className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Email address (Static Credential)
                    </label>
                    <div className="relative">
                      <input 
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full h-9 bg-muted/65 border border-border rounded-lg pl-3 pr-8 text-xs font-bold text-muted-foreground cursor-not-allowed select-none"
                        placeholder="email@example.com"
                      />
                      <Mail className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                        Primary Phone
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-9 bg-background border border-border rounded-lg pl-3 pr-8 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                          placeholder="e.g. +1 (555) 000-0000"
                        />
                        <Phone className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                        Secondary Phone
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={secondaryPhone}
                          onChange={(e) => setSecondaryPhone(e.target.value)}
                          className="w-full h-9 bg-background border border-border rounded-lg pl-3 pr-8 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                          placeholder="e.g. +1 (555) 111-2222"
                        />
                        <Phone className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Designation / Job Title
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full h-9 bg-background border border-border rounded-lg pl-3 pr-8 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                        placeholder="e.g. Senior Accountant"
                      />
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full h-9 bg-background border border-border rounded-lg pl-3 pr-8 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                        placeholder="e.g. Finance & Accounting"
                      />
                      <Globe className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Section: Geographic Location */}
              <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Location & Address</h4>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                        City
                      </label>
                      <input 
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-9 bg-background border border-border rounded-lg px-3 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                        placeholder="e.g. New York"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                        State / Province
                      </label>
                      <input 
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full h-9 bg-background border border-border rounded-lg px-3 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                        placeholder="e.g. NY"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Country
                    </label>
                    <input 
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-9 bg-background border border-border rounded-lg px-3 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                      placeholder="e.g. United States"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Street Address
                    </label>
                    <input 
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-9 bg-background border border-border rounded-lg px-3 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                      placeholder="e.g. 5th Avenue, Suite 100"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Area Section: Professional Bio */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border pb-2.5">
                <AlignLeft className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Biography & Summary</h4>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                  Tell us about yourself
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg p-3 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary transition-colors"
                  placeholder="Summarize your professional specialties or credentials..."
                />
              </div>
            </div>

            {/* Bottom Actions Fixed-like trigger */}
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto h-10 px-5 bg-primary text-white hover:opacity-90 disabled:opacity-50 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm font-mono"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save profile credentials</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}
