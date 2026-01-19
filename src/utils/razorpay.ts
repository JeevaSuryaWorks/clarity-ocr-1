
export const loadRazorpay = (): Promise<any> => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
            resolve((window as any).Razorpay);
        };
        script.onerror = () => {
            resolve(null);
        };
        document.body.appendChild(script);
    });
};
