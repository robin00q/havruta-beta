import { MATH_CATEGORIES, MathCategory } from '@/types/mathTypes';

interface CategorySelectorProps {
  selectedCategory: MathCategory;
  onCategoryChange: (category: MathCategory) => void;
}

export default function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">난이도 선택</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MATH_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-200'
            }`}
          >
            <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            <div className="text-xs text-gray-500">
              <p>학년: {category.gradeLevel}</p>
              <p>연산: {category.operations}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 