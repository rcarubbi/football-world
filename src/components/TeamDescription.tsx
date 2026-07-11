import { Card, CardContent } from "./ui/Card";

interface TeamDescriptionProps {
  content: string;
}

export function TeamDescription({ content }: TeamDescriptionProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          About
        </h2>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          {content.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
              {paragraph}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
