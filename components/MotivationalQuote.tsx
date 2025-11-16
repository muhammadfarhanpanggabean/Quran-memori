import React from 'react';

interface MotivationalQuoteProps {
  quote: string;
}

const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({ quote }) => {
  const words = quote.split(' ');

  return (
    <div className="w-full max-w-2xl text-center mb-8">
      <p className="text-lg italic text-slate-600">
        "
        {words.map((word, index) => (
          <span
            key={index}
            className="inline-block opacity-0 animate-quote-word-in"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            {word}&nbsp;
          </span>
        ))}
        "
      </p>
    </div>
  );
};

export default MotivationalQuote;
