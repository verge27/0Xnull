import { Check, Package, CreditCard, Truck, CheckCircle, AlertCircle } from 'lucide-react';

interface OrderStepperProps {
  status: 'created' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded';
}

export const OrderStepper = ({ status }: OrderStepperProps) => {
  const steps = [
    { key: 'created', label: 'Created', icon: Package },
    { key: 'paid', label: 'Paid', icon: CreditCard },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
    { key: 'completed', label: 'Completed', icon: Check },
  ];

  if (status === 'disputed' || status === 'refunded') {
    return (
      <div className="flex items-center justify-center p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle className="w-6 h-6 text-destructive mr-2" />
        <span className="font-semibold text-destructive">
          {status === 'disputed' ? 'Order Disputed' : 'Order Refunded'}
        </span>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isComplete = index < currentStepIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground scale-110' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <span className={`text-xs font-medium text-center ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
