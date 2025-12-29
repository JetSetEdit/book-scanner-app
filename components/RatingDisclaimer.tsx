import { Info } from 'lucide-react';

export function RatingDisclaimer() {
  return (
    <div className="flex flex-col gap-3 mt-2 p-4 bg-secondary/30 rounded-md text-xs text-muted-foreground border border-border/50">
      
      {/* Header */}
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <p className="font-medium text-foreground">How ratings are determined</p>
      </div>

      {/* Process Explanation */}
      <div className="space-y-2 pl-6">
        <p>
          Our AI analyzes the book's content and assigns severity scores (0.0-1.0) to each warning. 
          The classification is determined by the highest severity found—severe warnings indicate MA15+/R18+, 
          moderate indicates M, mild indicates PG, and no warnings indicates G.
        </p>
        
        {/* Severity Scale - Visual List */}
        <ul className="space-y-1 list-disc pl-4 opacity-90 font-mono text-[10px] sm:text-xs">
          <li><span className="font-bold text-red-400">0.81 - 1.00</span> : Severe (MA15+ / R18+)</li>
          <li><span className="font-bold text-orange-400">0.56 - 0.80</span> : Moderate (M)</li>
          <li><span className="font-bold text-yellow-400">0.31 - 0.55</span> : Mild (PG)</li>
          <li><span className="font-bold text-green-400">0.00 - 0.30</span> : None / Very Mild (G)</li>
        </ul>
      </div>

      {/* Legal Disclaimer */}
      <div className="pl-6 pt-2 border-t border-border/50">
        <p className="opacity-70 italic">
          This is an indicative rating only. We have no association with the Australian Classification Board and this is not an official rating.
        </p>
      </div>

    </div>
  );
}