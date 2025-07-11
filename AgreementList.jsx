import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAgreementContext } from '../../context/AgreementContext';
import { FiEye, FiEdit } from 'react-icons/fi';
import axiosInstance from '../../axiosConfig';

const StatusBadge = ({ status }) => {
  const badgeStyle = {
    display: 'inline-block',
    padding: '0.3rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  };

  // Normalize status: capitalize first letter, lowercase the rest
  let normalizedStatus =
    typeof status === 'string' && status.length > 0
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : '';

  // Map 'Ongoing' to 'Active'
  if (normalizedStatus === 'Ongoing') {
    normalizedStatus = 'Active';
  }

  const statusStyle = {
    Active: { backgroundColor: '#28a745' },
    Expired: { backgroundColor: '#dc3545' },
    Cancelled: { backgroundColor: '#6c757d' },
    // Add more statuses if needed
  };

  const style = statusStyle[normalizedStatus] || { backgroundColor: '#888' };

  return (
    <span style={{ ...badgeStyle, ...style }}>
      {normalizedStatus || 'Unknown'}
    </span>
  );
};

export default function AgreementList({ agreements: propAgreements }) {
  const { startEditing, deleteAgreement, prepareNewAgreement } = useAgreementContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [departments, setDepartments] = useState([]);

  const handleCreate = () => {
    prepareNewAgreement();
    navigate('/agreements/create');
  };

  const handleEdit = (agreement) => {
    startEditing(agreement);
    navigate(`/agreements/edit/${agreement.id || agreement.agreementId}`);
  };

  const handleView = (agreement) => {
    startEditing(agreement);
    navigate(`/agreements/preview/${agreement.id || agreement.agreementId}`);
  };

 

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        setLoading(true);
        // Use the correct API endpoint for agreements list
        const response = await axiosInstance.get('agreements/');
        
        // Handle both array and paginated responses
        const agreementsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.agreements || response.data.results || []);
        
        setAgreements(agreementsData);
        
        // Set departments if available
        if (response.data.departments) {
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error('Error fetching agreements:', error);
        setError('Failed to load agreements');
      } finally {
        setLoading(false);
      }
    };

    fetchAgreements();
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading agreements...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
        <div>{error}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="agreement-list" style={{width: '100%', maxWidth: '1200px', margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h2>My Agreements</h2>
        <button onClick={handleCreate} className="btn btn-primary" style={{textDecoration: 'none', border: 'none', color: '#fff', background: '#007bff', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer'}}>Create New Agreement</button>
      </div>
      
      {agreements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div>No agreements found.</div>
          <button onClick={handleCreate} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Create Your First Agreement
          </button>
        </div>
      ) : (
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #eee'}}>
              <th style={{padding: '1rem', textAlign: 'left'}}>Title</th>
              <th style={{padding: '1rem', textAlign: 'left'}}>Department</th>
              <th style={{padding: '1rem', textAlign: 'left'}}>Party</th>
              <th style={{padding: '1rem', textAlign: 'left'}}>Status</th>
              <th style={{padding: '1rem', textAlign: 'left'}}>Start Date</th>
              <th style={{padding: '1rem', textAlign: 'left'}}>Expiry Date</th>
              <th style={{padding: '1rem', textAlign: 'left'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((agreement, index) => (
              <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                <td style={{padding: '1rem'}}>{agreement.title || agreement.agreementTitle}</td>
                <td style={{padding: '1rem'}}>{agreement.agreement_type_name || agreement.department?.name || agreement.department}</td>
                <td style={{padding: '1rem'}}>{agreement.party_name_display || agreement.party_name?.name || agreement.party_name || agreement.type || agreement.party}</td>
                <td style={{padding: '1rem'}}><StatusBadge status={agreement.status} /></td>
                <td style={{padding: '1rem'}}>{agreement.start_date || agreement.startDate}</td>
                <td style={{padding: '1rem'}}>{agreement.expiry_date || agreement.expiryDate}</td>
                <td style={{padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <button onClick={() => handleView(agreement)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#007bff' }}>
                    <FiEye size={18} />
                  </button>
                  <button onClick={() => handleEdit(agreement)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#28a745' }}>
                    <FiEdit size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 