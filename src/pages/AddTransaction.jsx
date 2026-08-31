import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import ExcelQuickEntry from '../components/common/ExcelQuickEntry';

const AddTransaction = () => {
  const [searchParams] = useSearchParams();
  const preselectedBusiness = searchParams.get('business') || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <PageHeader
        title="Easy Add Transaction"
        subtitle="Quickly record sales, equipment rentals, or material supplies line-by-line"
        backUrl="/transactions"
      />

      {/* Table Entry View as Default & Only View */}
      <ExcelQuickEntry initialMode="transaction" defaultBusinessId={preselectedBusiness} />
    </div>
  );
};

export default AddTransaction;
