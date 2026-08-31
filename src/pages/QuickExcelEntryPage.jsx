import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import ExcelQuickEntry from '../components/common/ExcelQuickEntry';

const QuickExcelEntryPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'transaction';
  const defaultBusiness = searchParams.get('business') || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Quick Table Entry"
        subtitle="Record multiple sales transactions or business expenses line-by-line in a simple table view"
        backUrl="/"
      />

      <ExcelQuickEntry initialMode={initialMode} defaultBusinessId={defaultBusiness} />
    </div>
  );
};

export default QuickExcelEntryPage;
