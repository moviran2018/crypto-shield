import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function History() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Analysis History
        </h1>
        <p className="text-brand-offwhite/60 text-lg">
          View your past contract analyses and trends.
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-brand-offwhite/30 text-lg mb-2">
            No analysis history yet.
          </p>
          <p className="text-brand-offwhite/20 text-sm">
            Your recent analyses will appear here once you start using the analyzer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
