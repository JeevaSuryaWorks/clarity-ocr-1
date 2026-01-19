import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Users, Globe, Copy, Trash2, Mail, ExternalLink, Shield } from 'lucide-react';
import {
    createOrUpdatePublicShareLink,
    inviteUser,
    removeUser,
    updateChecklistPermissions,
} from '@/services/shareService';
import { SharedPermissions, Checklist as PublicChecklist, AccessRole } from '@/types/checklist';
import { HistoryItem } from '@/types/task';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface ShareDialogProps {
    historyItem: HistoryItem;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ historyItem }) => {
    const { toast } = useToast();
    const [permissions, setPermissions] = useState<SharedPermissions>({
        public: { enabled: false, role: 'viewer' },
        users: {}
    });
    const [shareId, setShareId] = useState<string | null>(historyItem.shareId || null);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');

    // Real-time listener for permissions
    useEffect(() => {
        if (!shareId) return;
        const unsub = onSnapshot(doc(db, 'publicChecklists', shareId), (snap) => {
            if (snap.exists()) {
                const data = snap.data() as PublicChecklist;
                if (data.permissions) {
                    setPermissions(data.permissions);
                }
            }
        });
        return () => unsub();
    }, [shareId]);

    const handleCreateLink = async () => {
        setLoading(true);
        try {
            const newShareId = await createOrUpdatePublicShareLink(historyItem);
            setShareId(newShareId);
            toast({ title: "Link Created", description: "You can now share this checklist." });
        } catch {
            toast({ title: "Error", description: "Could not create share link.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !shareId) return;
        setLoading(true);
        try {
            await inviteUser(shareId, inviteEmail, inviteRole);
            toast({ title: "User Invited", description: `${inviteEmail} has been added.` });
            setInviteEmail("");
        } catch {
            toast({ title: "Error", description: "Could not invite user.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveUser = async (email: string) => {
        if (!shareId) return;
        try {
            await removeUser(shareId, email);
            toast({ title: "User Removed", description: "Access revoked." });
        } catch {
            toast({ title: "Error", description: "Could not remove user.", variant: "destructive" });
        }
    };

    const updatePublicSettings = async (enabled: boolean, role: AccessRole) => {
        if (!shareId) return;
        const newPermissions: SharedPermissions = {
            ...permissions,
            public: { enabled, role }
        };
        try {
            if (!enabled) {
                // If disabling, we still keep the doc but just set enabled: false in permissions? 
                // Or update createOrUpdatePublicShareLink logic? 
                // Current logic: we update the existing doc.
            }
            await updateChecklistPermissions(shareId, newPermissions);
            // Optimistic update handled by snapshot listener
        } catch {
            toast({ title: "Error", description: "Could not update settings.", variant: "destructive" });
        }
    };

    const copyLink = () => {
        if (!shareId) return;
        const url = `${window.location.origin}/checklist/public/${shareId}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Copied!", description: "Link copied to clipboard." });
    };

    const shareUrl = shareId ? `${window.location.origin}/checklist/public/${shareId}` : "";

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="glass-button h-9 rounded-full px-4 border-violet-200/50 hover:bg-violet-50 text-violet-700">
                    <Users className="w-4 h-4 mr-2" /> Share
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 pr-6 break-words line-clamp-2 leading-tight">
                        Share "{historyItem.title}"
                    </DialogTitle>
                    <div className="sr-only">
                        Manage public access and user invitations for this checklist.
                    </div>
                </DialogHeader>

                {!shareId ? (
                    <div className="py-8 text-center space-y-4">
                        <div className="p-4 bg-violet-100 dark:bg-violet-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-violet-600 mb-6">
                            <Globe className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Publish to Web</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[80%] mx-auto">Create a secure link to share this checklist with others.</p>
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleCreateLink} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium h-11">
                                {loading ? "Creating Link..." : "Create Share Link"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Tabs defaultValue="invite" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
                            <TabsTrigger value="invite" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-300">Invite People</TabsTrigger>
                            <TabsTrigger value="link" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-300">Public Link</TabsTrigger>
                        </TabsList>

                        <TabsContent value="invite" className="space-y-4 focus:outline-none">
                            <div className="flex gap-2 p-1">
                                <Input
                                    placeholder="Enter email address"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-200 focus-visible:ring-violet-500 text-slate-900 dark:text-slate-100"
                                />
                                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                    <SelectTrigger className="w-[110px] bg-white dark:bg-slate-950 border-slate-200 text-slate-900 dark:text-slate-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleInvite} disabled={loading || !inviteEmail} className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shrink-0">
                                    <Mail className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2 mt-6">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Access List</Label>
                                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto">
                                    {/* Owner */}
                                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800">
                                                YOU
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">You (Owner)</p>
                                                <p className="text-xs text-slate-500">Full Access</p>
                                            </div>
                                        </div>
                                        <Shield className="w-4 h-4 text-violet-500 opacity-50" />
                                    </div>

                                    {/* Invited Users */}
                                    {Object.entries(permissions.users).map(([email, info]) => (
                                        <div key={email} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-xs font-bold text-violet-600">
                                                    {email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{email}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{info.role}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveUser(email)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {Object.keys(permissions.users).length === 0 && (
                                        <div className="p-4 text-center text-xs text-slate-400 italic">
                                            No one else has been invited yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="link" className="space-y-5 focus:outline-none pt-2">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-full ${permissions.public.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Public Access</p>
                                        <p className="text-xs text-slate-500">
                                            {permissions.public.enabled
                                                ? `Anyone with the link can ${permissions.public.role}`
                                                : "Link is disabled"}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={permissions.public.enabled}
                                    onCheckedChange={(c) => updatePublicSettings(c, permissions.public.role)}
                                />
                            </div>

                            {permissions.public.enabled && (
                                <div className="space-y-3 animation-fade-in">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Role</Label>
                                        <Select
                                            value={permissions.public.role}
                                            onValueChange={(v: any) => updatePublicSettings(true, v)}
                                        >
                                            <SelectTrigger className="w-[140px] h-8 text-xs bg-white dark:bg-slate-950">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                <SelectItem value="editor">Editor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Input
                                            value={shareUrl}
                                            readOnly
                                            className="bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-600 dark:text-slate-400 select-all"
                                        />
                                        <Button variant="secondary" onClick={copyLink} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => window.open(shareUrl, '_blank')}>
                                            <ExternalLink className="w-4 h-4 text-slate-500" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};
