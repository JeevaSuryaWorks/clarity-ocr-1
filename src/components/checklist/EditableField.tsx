import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface EditableFieldProps {
    value: string;
    onSave: (value: string) => void;
    className?: string;
    isTextarea?: boolean;
    type?: 'text' | 'textarea' | 'select' | 'number';
    placeholder?: string;
    readOnly?: boolean;
    onClick?: (e: React.MouseEvent) => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onSave,
    className,
    isTextarea = false,
    type = 'text',
    placeholder,
    readOnly = false,
    ...rest
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing) {
            if (type === 'textarea' || isTextarea) textareaRef.current?.focus();
            else inputRef.current?.focus();
        }
    }, [isEditing, type, isTextarea]);

    const handleSave = () => {
        const next = currentValue.trim();
        if (next !== value.trim()) onSave(next);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    const effectiveType = isTextarea ? 'textarea' : type;

    if (readOnly) {
        const displayValue = value || placeholder || (isTextarea ? "No description." : "");
        return (
            <div className={`${className} p-1 -ml-1 ${!value ? 'text-muted-foreground italic' : ''}`}>
                {effectiveType === 'select' ? (
                    <Badge variant="outline" className={`
               ${value === 'critical' ? 'border-red-500 text-red-600 bg-red-50' :
                            value === 'high' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                                value === 'medium' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                                    value === 'low' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                        'border-slate-300 text-slate-500'
                        }
             `}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Badge>
                ) : displayValue}
            </div>
        );
    }

    if (isEditing) {
        switch (effectiveType) {
            case 'textarea':
                return (
                    <Textarea
                        ref={textareaRef}
                        value={currentValue}
                        onChange={e => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${className} min-h-[80px] bg-white/50 dark:bg-black/30 backdrop-blur-md border-violet-200/50 focus:ring-violet-500/50`}
                        placeholder={placeholder}
                        {...rest}
                    />
                );
            case 'select':
                return (
                    <Select
                        value={currentValue}
                        onValueChange={val => { onSave(val); setIsEditing(false); }}
                        open={true}
                        onOpenChange={(open) => !open && setIsEditing(false)}
                    >
                        <SelectTrigger className="h-7 px-2 text-xs w-28 border-violet-200/50 bg-white/50">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {(['critical', 'high', 'medium', 'low', 'none'] as const).map(p =>
                                <SelectItem key={p} value={p}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${p === 'critical' ? 'bg-red-500' :
                                            p === 'high' ? 'bg-orange-500' :
                                                p === 'medium' ? 'bg-yellow-500' :
                                                    p === 'low' ? 'bg-blue-500' : 'bg-slate-300'
                                            }`} />
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </div>
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                );
            default:
                return (
                    <Input
                        type={type}
                        ref={inputRef}
                        value={currentValue}
                        onChange={e => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${className} h-8 bg-white/50 dark:bg-black/30 backdrop-blur-md border-violet-200/50 focus:ring-violet-500/50`}
                        placeholder={placeholder}
                        {...rest}
                    />
                );
        }
    }

    const displayValue = value || placeholder || (isTextarea ? "Click to add description..." : "Click to edit...");

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`${className} cursor-text p-1 -ml-1 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${!value ? 'text-muted-foreground italic' : ''}`}
            role="button"
            tabIndex={0}
            {...rest}
        >
            {effectiveType === 'select' ? (
                <Badge variant="outline" className={`
           ${value === 'critical' ? 'border-red-500 text-red-600 bg-red-50' :
                        value === 'high' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                            value === 'medium' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                                value === 'low' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                    'border-slate-300 text-slate-500'
                    }
         `}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                </Badge>
            ) : displayValue}
        </div>
    );
};
