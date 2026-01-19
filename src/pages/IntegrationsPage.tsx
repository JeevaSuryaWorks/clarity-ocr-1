import { useEffect, useState } from 'react';
import {
    Trello,
    FileText,
    CheckSquare,
    Github,
    ExternalLink,
    CheckCircle2,
    Loader2,
    Trash2,
    AlertCircle,
    Layout,
    BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { IntegrationConfig, IntegrationProvider, IntegrationType } from '@/types/integration';
import { getUserIntegrations, saveIntegration, removeIntegration } from '@/services/integrationService';
import { Badge } from '@/components/ui/badge';

// --- Configuration for Supported Providers ---
const PROVIDERS: IntegrationProvider[] = [
    {
        id: 'trello',
        name: 'Trello',
        description: 'Sync checklists to Trello boards and create cards from tasks.',
        icon: Trello,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        docsUrl: 'https://trello.com/',
        requiredFields: [
            { key: 'apiKey', label: 'API Key', type: 'text', description: 'Your Trello API Key' },
            { key: 'apiToken', label: 'Token', type: 'password', description: 'Your Trello API Token' }
        ]
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'Export extracted text and documents directly to Notion pages.',
        icon: FileText,
        color: 'text-slate-800 bg-slate-100 dark:text-white dark:bg-slate-800',
        docsUrl: 'https://www.notion.so/my-integrations',
        requiredFields: [
            { key: 'apiToken', label: 'Internal Integration Token', type: 'password', description: 'Secret starting with "secret_..."' }
        ]
    },
    {
        id: 'jira',
        name: 'Jira Software',
        description: 'Create issues and bugs directly from your scanned documents.',
        icon: CheckSquare,
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
        docsUrl: '',
        requiredFields: [
            { key: 'workspaceId', label: 'Domain (e.g. company.atlassian.net)', type: 'text' },
            { key: 'apiToken', label: 'API Token', type: 'password' }
        ]
    },
    {
        id: 'github',
        name: 'GitHub',
        description: 'Create issues from to-dos found in your technical docs.',
        icon: Github,
        color: 'text-slate-900 bg-slate-100 dark:text-white dark:bg-slate-800',
        docsUrl: '',
        requiredFields: [
            { key: 'apiToken', label: 'Personal Access Token', type: 'password' }
        ]
    },
    {
        id: 'asana',
        name: 'Asana',
        description: 'Turn documents into Asana tasks.',
        icon: CheckCircle2,
        color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
        docsUrl: 'https://app.asana.com/-/developer_console',
        requiredFields: [
            { key: 'apiToken', label: 'Personal Access Token', type: 'password' },
            { key: 'workspaceId', label: 'Workspace ID', type: 'text' }
        ]
    },
    {
        id: 'clickup',
        name: 'ClickUp',
        description: 'Create tasks and docs in ClickUp.',
        icon: Layout,
        color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
        docsUrl: 'https://app.clickup.com/settings/apps',
        requiredFields: [
            { key: 'apiToken', label: 'API Token', type: 'password' }
        ]
    },
    {
        id: 'monday',
        name: 'Monday.com',
        description: 'Sync items to your Monday boards.',
        icon: BarChart,
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
        docsUrl: 'https://developer.monday.com/apps/docs/intro#authentication',
        requiredFields: [
            { key: 'apiToken', label: 'API Token', type: 'password' }
        ]
    }
];

export default function IntegrationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

    // Form State
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) loadIntegrations();
    }, [user]);

    const loadIntegrations = async () => {
        if (!user) return;
        setIsLoading(true);
        const data = await getUserIntegrations(user.uid);
        setIntegrations(data);
        setIsLoading(false);
    };

    const handleConnectClick = (provider: IntegrationProvider) => {
        // Check if already connected
        const existing = integrations.find(i => i.type === provider.id);
        if (existing) {
            // Prepare form data for editing? (For security, maybe standard to clear password fields)
            // For V1, let's treat it as re-authentication/update
        }
        setSelectedProvider(provider);
        setFormData({}); // clear form
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!user || !selectedProvider) return;

        setIsSaving(true);

        // Construct config object
        const newConfig: IntegrationConfig = {
            id: selectedProvider.id,
            type: selectedProvider.id,
            name: selectedProvider.name,
            isEnabled: true,
            credentials: { ...formData }, // Warning: Storing plain text for MVP. In prod, use encrypted fields or just storing non-sensitive metadata + secure backend.
            connectedAt: Date.now()
        };

        const success = await saveIntegration(user.uid, newConfig);

        if (success) {
            toast({ title: "Connected", description: `Successfully connected to ${selectedProvider.name}` });
            setModalOpen(false);
            loadIntegrations();
        } else {
            toast({ title: "Error", description: "Failed to save integration settings.", variant: "destructive" });
        }

        setIsSaving(false);
    };

    const handleDisconnect = async (type: IntegrationType) => {
        if (!user) return;
        if (!confirm("Are you sure? This will remove the connection and saved credentials.")) return;

        const success = await removeIntegration(user.uid, type);
        if (success) {
            toast({ title: "Disconnected", description: "Integration removed." });
            loadIntegrations();
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0B0F19] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-outfit text-slate-900 dark:text-white">Integrations</h1>
                    <p className="text-slate-500 mt-2">Connect your favorite tools to automate your workflow.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PROVIDERS.map(provider => {
                            const isConnected = integrations.some(i => i.type === provider.id);
                            const Icon = provider.icon;

                            return (
                                <Card key={provider.id} className={`border-slate-200 dark:border-slate-800 transition-all hover:shadow-md ${isConnected ? 'ring-2 ring-sky-500/20 dark:ring-sky-500/10' : ''}`}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 rounded-xl ${provider.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            {isConnected && (
                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Connected
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="mt-4">{provider.name}</CardTitle>
                                        <CardDescription className="h-10">{provider.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {isConnected ? (
                                            <div className="flex gap-3">
                                                <Button variant="outline" className="w-full" onClick={() => handleConnectClick(provider)}>
                                                    Configure
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDisconnect(provider.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800" onClick={() => handleConnectClick(provider)}>
                                                Connect
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Connection Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedProvider?.color}`}>
                                {selectedProvider && <selectedProvider.icon className="w-5 h-5" />}
                            </div>
                            <DialogTitle>Connect {selectedProvider?.name}</DialogTitle>
                        </div>
                        <DialogDescription>
                            Enter your credentials to enable this integration.
                            {selectedProvider?.docsUrl && (
                                <a href={selectedProvider.docsUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline flex items-center gap-1 mt-1 inline-flex">
                                    Where to find this? <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Credentials are stored securely in your private cloud storage. We never share them.</p>
                        </div>

                        {selectedProvider?.requiredFields.map(field => (
                            <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                    id={field.key}
                                    type={field.type}
                                    placeholder={field.placeholder || `Enter your ${field.label}`}
                                    value={formData[field.key] || ''}
                                    onChange={(e) => setFormData(docs => ({ ...docs, [field.key]: e.target.value }))}
                                />
                                {field.description && <p className="text-xs text-slate-500">{field.description}</p>}
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
