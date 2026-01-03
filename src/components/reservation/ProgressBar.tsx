import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  number: number
  label: string
}

interface ProgressBarProps {
  steps: Step[]
  currentStep: number
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            {/* Circle */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all',
                currentStep > step.number
                  ? 'bg-primary-600 text-white'
                  : currentStep === step.number
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : 'bg-secondary-200 text-secondary-500'
              )}
            >
              {currentStep > step.number ? (
                <Check className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            {/* Label */}
            <span
              className={cn(
                'text-xs mt-2 text-center',
                currentStep >= step.number
                  ? 'text-primary-700 font-medium'
                  : 'text-secondary-500'
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-1 mx-2 rounded transition-all',
                currentStep > step.number
                  ? 'bg-primary-600'
                  : 'bg-secondary-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
