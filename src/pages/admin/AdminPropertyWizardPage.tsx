import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProperties } from '../../context/PropertyContext';
import { PropertyWizard } from '../../components/admin/PropertyWizard';

export const AdminPropertyWizardPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { getPropertyById, loading } = useProperties();
  const existingProperty = id ? getPropertyById(id) : undefined;

  if (id && loading) {
    return <p className="text-xs text-slate-400">Loading the stay…</p>;
  }

  if (id && !existingProperty) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white">That stay wasn't found. It may have been deleted.</p>
        <Link to="/admin/properties" className="text-xs text-brand-gold hover:underline">
          Back to properties
        </Link>
      </div>
    );
  }

  // The key makes the form start fresh when switching between stays
  return <PropertyWizard key={existingProperty?.id ?? 'new'} existingProperty={existingProperty} />;
};
