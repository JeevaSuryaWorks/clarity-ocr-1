import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";

interface PasswordDialogProps {
    isOpen: boolean;
    onSubmit: (password: string) => void;
    onCancel: () => void;
    fileName: string;
}

export function PasswordDialog({ isOpen, onSubmit, onCancel, fileName }: PasswordDialogProps) {
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            onSubmit(password);
            setPassword("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <div className="mx-auto bg-violet-100 dark:bg-violet-900/30 p-3 rounded-full w-fit mb-2">
                        <LockKeyhole className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <DialogTitle className="text-center text-xl">Protected Document</DialogTitle>
                    <DialogDescription className="text-center">
                        "{fileName}" is password protected. <br />
                        Please enter the password to unlock and analyze.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="text-center text-lg tracking-widest"
                        autoFocus
                    />
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]">
                            Unlock
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
