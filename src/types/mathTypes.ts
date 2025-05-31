export type MathCategory = 'addition_subtraction' | 'multiplication_division';

export interface CategoryInfo {
  id: MathCategory;
  title: string;
  description: string;
  gradeLevel: string;
  operations: string;
}

export const MATH_CATEGORIES: CategoryInfo[] = [
  {
    id: 'addition_subtraction',
    title: '기초 연산',
    description: '덧셈과 뺄셈 문제',
    gradeLevel: '유치원 ~ 초등학교 1학년',
    operations: '덧셈, 뺄셈'
  },
  {
    id: 'multiplication_division',
    title: '응용 연산',
    description: '곱셈과 나눗셈 문제',
    gradeLevel: '초등학교 2~3학년',
    operations: '곱셈, 나눗셈'
  }
]; 