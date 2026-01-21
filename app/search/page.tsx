import { Suspense } from 'react';
import Container from '@/components/layout/Container';
import SearchContent from './SearchContent';

function SearchLoading() {
  return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-text-secondary">검색 중...</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="py-10">
      <Container>
        <Suspense fallback={<SearchLoading />}>
          <SearchContent />
        </Suspense>
      </Container>
    </div>
  );
}
