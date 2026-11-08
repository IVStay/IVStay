import React from 'react';
import { useParams } from 'react-router-dom';
import { useProperties } from '../../context/PropertyContext';
import { PropertyWizard } from '../../components/admin/PropertyWizard';

export const AdminPropertyWizardPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { getPropertyById } = useProperties();

  const existingProperty = id ? getPropertyById(id) : undefined;

  return (
    <div>
      <PropertyWizard existingProperty={existingProperty} />
    </div>
  );
};
