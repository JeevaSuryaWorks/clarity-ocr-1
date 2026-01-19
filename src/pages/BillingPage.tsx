
import { useState } from 'react';
import { loadRazorpay } from '@/utils/razorpay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, History, Package } from 'lucide-react';

export default function BillingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        const res = await loadRazorpay();

        if (!res) {
            setLoading(false);
            toast({
                title: "Razorpay SDK Failed",
                description: "Could not load payment gateway. Check connection.",
                variant: "destructive"
            });
            return;
        }

        const options = {
            key: "rzp_test_YourKeyHere", // User needs to provide this or we use a dummy
            amount: 2900, // Amount in paise (29 INR)
            currency: "INR",
            name: "Clarity OCR Pro",
            description: "Monthly Subscription",
            image: "https://your-logo-url.com/logo.png",
            handler: function (response: any) {
                toast({
                    title: "Payment Successful",
                    description: `Payment ID: ${response.razorpay_payment_id}`,
                });
                // Here you would verify payment on backend
            },
            prefill: {
                name: "Jeeva Surya",
                email: "jeeva@example.com",
                contact: "9999999999",
            },
            notes: {
                address: "Razorpay Corporate Office",
            },
            theme: {
                color: "#4f46e5",
            },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Billing & Subscription</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Package className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Current Plan</h3>
                            <p className="text-slate-500">Free Tier</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[75%]" />
                        </div>
                        <p className="text-sm text-slate-500">75% Storage Used (35MB / 50MB)</p>
                        <Button onClick={handlePayment} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading ? "Processing..." : "Upgrade to Pro"}
                        </Button>
                    </div>
                </Card>

                <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <CreditCard className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Payment Method</h3>
                            <p className="text-slate-500">Manage your cards and details</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">No payment method added yet.</p>
                    <Button variant="outline" className="w-full">Add Payment Method</Button>
                </Card>
            </div>

            <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="font-semibold text-lg">Billing History</h3>
                </div>
                <div className="text-center py-8 text-slate-500">
                    No previous invoices found.
                </div>
            </Card>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-4">Your Razorpay Integration Details</h4>
                <pre className="text-xs bg-black text-green-400 p-4 rounded-lg overflow-x-auto">
                    {`"Registered Name": "Razorpay Payments Private Limited"
"CIN": "U62099KA2024PTC188982"
"PAN": "AANCR6717K"
"TAN": "BLRR30567F"
"GST": "29AANCR6717K1ZN"`}
                </pre>
            </div>
        </div>
    );
}
