import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { uploadFileToSupabase, getAuthenticatedSupabase, syncUserToSupabase } from '@/services/supabase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, KeyRound, AlertTriangle, Mail, Camera, LogOut, Upload, User, ShieldCheck, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
    }
  }, [user, isEditOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setEditFile(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setUpdateLoading(true);
    try {
      let photoURL = auth.currentUser.photoURL;

      if (editFile) {
        try {
          const path = await uploadFileToSupabase('profile_photos', editFile, 'avatar');
          const sb = await getAuthenticatedSupabase();
          // We assume public access for profile photos
          const { data } = sb.storage.from('profile_photos').getPublicUrl(path);
          photoURL = data.publicUrl;
        } catch (uploadErr: any) {
          console.error("Critical Upload Error:", uploadErr);
          toast.error(`Upload failed: ${uploadErr.message}`);
          setUpdateLoading(false);
          return;
        }
      }

      await updateProfile(auth.currentUser, {
        displayName: editName,
        photoURL: photoURL
      });

      if (user && (editFile || editName !== user.displayName)) {
        await syncUserToSupabase();
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: editName,
        photoURL: photoURL
      });

      await refreshUser();
      toast.success("Profile updated successfully!");
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setUpdateLoading(false);
    }
  };


  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      toast.error('Failed to logout');
    }
  };

  const handleDeleteData = async () => {
    setDeleteLoading(true);
    setTimeout(() => {
      toast.success('This feature is coming soon! Your data is safe for now.');
      setDeleteLoading(false);
    }, 1500);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] pb-12 pt-10">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile Header Block */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-[#111625] shadow-xl bg-white cursor-pointer transition-transform hover:scale-105" onClick={() => setIsEditOpen(true)}>
              <AvatarImage src={user.photoURL || ''} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-violet-100 text-violet-700">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => setIsEditOpen(true)}
              className="absolute bottom-1 right-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-100 hover:bg-slate-50 transition-colors text-violet-600"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 pb-2 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{user.displayName || 'User'}</h1>
            <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-2 mb-4">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Button onClick={() => setIsEditOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
                Edit Profile
              </Button>
              <Button onClick={handleLogout} variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left Column: Stats & Identity */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white dark:bg-[#111625] rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-violet-500" /> Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">User ID</Label>
                  <div className="font-mono text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded mt-1 break-all border border-slate-100">
                    {user.uid}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Created</Label>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-3xl overflow-hidden">
              <CardContent className="pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Pro Plan</h3>
                  <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </div>
                <p className="text-violet-100 text-sm mb-6">
                  You are on the free tier. Upgrade to unlock unlimited OCR and advanced AI features.
                </p>
                <Button className="w-full bg-white text-violet-600 hover:bg-violet-50 border-none">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Settings */}
          <div className="md:col-span-2 space-y-6">

            {/* Security Section */}
            <Card className="border-none shadow-xl bg-white dark:bg-[#111625] rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Security
                </CardTitle>
                <CardDescription>Manage your password and authentication methods.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                      <KeyRound className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Password</div>
                      <div className="text-sm text-slate-500">Last changed recently</div>
                    </div>
                  </div>
                  <Button onClick={handlePasswordReset} disabled={resetLoading} variant="outline" size="sm">
                    {resetLoading ? "Sending..." : "Reset Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-none shadow-xl bg-white dark:bg-[#111625] rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Delete Account</div>
                    <div className="text-sm text-slate-500 max-w-sm">
                      Permanently delete your account and all of your data. This action cannot be undone.
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-500 hover:bg-red-600">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteData} className="bg-red-500 hover:bg-red-600" disabled={deleteLoading}>
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Make changes to your profile here.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-2 border-slate-200">
                  <AvatarImage src={editPreview || user.photoURL || ''} className="object-cover" />
                  <AvatarFallback>{editName.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  <Label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" /> Change Photo
                  </Label>
                  {editPreview && (
                    <Button variant="ghost" size="sm" onClick={() => { setEditFile(null); setEditPreview(null); }} className="text-red-500 h-9">Remove</Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={updateLoading} className="bg-violet-600 hover:bg-violet-700">
                {updateLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}