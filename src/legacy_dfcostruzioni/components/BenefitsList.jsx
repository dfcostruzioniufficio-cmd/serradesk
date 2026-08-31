
import React from 'react';
import { Check } from 'lucide-react';

function BenefitsList({ benefits }) {
  return (
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" />
            </div>
          </div>
          <span className="text-base leading-relaxed">{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

export default BenefitsList;
