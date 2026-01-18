import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Upload, X, Users } from 'lucide-react';
import api, { memberAPI, branchAPI, departmentAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import FeatureGate from '../../../components/access/FeatureGate';
import { useAuth } from '../../../context/AuthContext';
import { validateEmail, validatePhone } from '../../../utils/validators';
import { useResourceLimit } from '../../../hooks/useResourceLimit';
import { PermissionRoute } from '../../../components/guards/PermissionRoute';


const NewMember = () => {
  const { user, fetchAndUpdateSubscription } = useAuth()
  const merchant = user?.merchant;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const memberLimit = useResourceLimit('members');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    branch: '',
    occupation: '',
    placeOfWork: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Ghana',
      postalCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    membershipStatus: 'active',
    membershipType: 'member',
    membershipDate: new Date().toISOString().split('T')[0],
    salvationDate: '',
    baptismDate: '',
    ministries: '',
    notes: '',
    bornAgain: null,
    baptismStatus: 'none',
    howDidYouJoin: '',
    howDidYouJoinOther: '',
    departments: [] as string[],
  primaryDepartment: '',
  });

  useEffect(() => {
    if(memberLimit?.canCreate){
      fetchBranches();
      fetchDepartments();
    }
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getDepartments();
      if (response.data.success) {
        setAvailableDepartments(response.data.data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchAPI.getBranches({ limit: 100, status: 'active' });
      setBranches(response.data.data.branches);
    } catch (error) {
      console.error('Failed to load branches:', error);
      showToast.error('Failed to load branches');
    }
  };

  const handleDepartmentToggle = (deptId: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptId)) {
        // Remove department
        const newDepts = prev.filter(id => id !== deptId);
        
        // If removing primary department, set new primary
        if (formData.primaryDepartment === deptId) {
          setFormData(prev => ({
            ...prev,
            primaryDepartment: newDepts[0] || '',
            departments: newDepts
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            departments: newDepts
          }));
        }
        
        return newDepts;
      } else {
        // Add department
        const newDepts = [...prev, deptId];
        
        // Set as primary if it's the first one
        if (newDepts.length === 1) {
          setFormData(prev => ({
            ...prev,
            primaryDepartment: deptId,
            departments: newDepts
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            departments: newDepts
          }));
        }
        
        return newDepts;
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Real-time email validation
    if (name === 'email') {
      if (value) {
        const validation = validateEmail(value);
        setEmailError(validation.valid ? '' : validation.error || '');
      } else {
        setEmailError('');
      }
    }
    
    // Real-time phone validation
    if (name === 'phone') {
      if (value) {
        const validation = validatePhone(value);
        setPhoneError(validation.valid ? '' : validation.error || '');
      } else {
        setPhoneError('Phone number is required');
      }
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size should be less than 5MB');
        return;
      }

      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // UPDATED: Added branch validation
    if (!formData.firstName || !formData.lastName || !formData.gender || !formData.branch) {
      showToast.error('Please fill in all required fields');
      return;
    }

    // Validate phone (required)
    if (!formData.phone) {
      showToast.error('Phone number is required');
      return;
    }

    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      showToast.error(phoneValidation.error || 'Please enter a valid phone number');
      return;
    }

    // Validate email if provided
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        showToast.error(emailValidation.error || 'Please enter a valid email address');
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        ministries: formData.ministries ? formData.ministries.split(',').map(m => m.trim()) : [],
        photo: photoFile // ✅ Include photo file if present
      };

      await memberAPI.createMember(dataToSubmit);
      showToast.success('Member added successfully!');
      await fetchAndUpdateSubscription();
      navigate('/members/all');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionRoute permission="members.create" redirectTo='/members/all'>
      <FeatureGate feature={'memberManagement'} usageExceeded={!memberLimit?.canCreate}>
      <div className="min-h-screen dark:bg-gray-900">
        {/* Header */}
        <div className="w-full dark:bg-gray-800 rounded-lg dark:border-gray-700">
          <div className="w-full mx-auto px-8 py-6">
            <div className="flex items-start space-x-4">
              <button
                onClick={() => navigate('/members/all')}
                className="bg-blue-600 p-2 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Members"
              >
                <ArrowLeft className="w-5 h-5 text-white dark:text-gray-400 " />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Add New Member
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Complete the form below to register a new church member
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="w-full mx-auto px-6 py-8">
          <form onSubmit={handleSubmit}>
            {/* Profile Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Profile Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Basic information about the member
                </p>
              </div>

              <div className="p-6">
                {/* Photo Upload Section */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    {/* Photo Preview */}
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden">
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Profile Photo
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Upload a profile picture (JPG, PNG, max 5MB)
                      </p>
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                        {photoFile && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {photoFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter middle name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors ${
                        emailError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="email@example.com"
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors ${
                        phoneError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="0241234567 or 233241234567"
                    />
                    {phoneError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Marital Status
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Occupation
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., Teacher, Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Place of Work
                      </label>
                      <input
                        type="text"
                        name="placeOfWork"
                        value={formData.placeOfWork || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., ABC School, XYZ Company"
                      />
                    </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Address
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Residential address details
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State/Region
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter state/region"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Emergency Contact
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Person to contact in case of emergency
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="+233-XXX-XXXX"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Church Information Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Church Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Membership and spiritual information
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ADDED: Branch Selection Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Select which branch this member belongs to
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Membership Status
                    </label>
                    <select
                      name="membershipStatus"
                      value={formData.membershipStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      {/* <option value="visitor">Visitor</option>
                      <option value="new_convert">New Convert</option> */}
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Membership Type
                    </label>
                    <select
                      name="membershipType"
                      value={formData.membershipType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="member">Member</option>
                      <option value="leader">Leader</option>
                      <option value="pastor">Pastor</option>
                      <option value="elder">Elder</option>
                      <option value="deacon">Deacon</option>
                      <option value="youth">Youth</option>
                      <option value="children">Children</option>
                      <option value="first-timer">First Timer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Membership Date
                    </label>
                    <input
                      type="date"
                      name="membershipDate"
                      value={formData.membershipDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Baptism Date
                    </label>
                    <input
                      type="date"
                      name="baptismDate"
                      value={formData.baptismDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salvation Date
                    </label>
                    <input
                      type="date"
                      name="salvationDate"
                      value={formData.salvationDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Departments/Ministries
                    </label>
                    
                    {availableDepartments.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableDepartments.map((dept) => {
                            const isSelected = selectedDepartments.includes(dept._id);
                            const isPrimary = formData.primaryDepartment === dept._id;
                            
                            return (
                              <div
                                key={dept._id}
                                className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                                onClick={() => handleDepartmentToggle(dept._id)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                      {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{dept.icon}</span>
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {dept.name}
                                      </h4>
                                    </div>
                                    
                                    {dept.description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {dept.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Primary department radio */}
                                {isSelected && selectedDepartments.length > 1 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <label 
                                      className="flex items-center space-x-2 text-xs cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="radio"
                                        name="primaryDepartment"
                                        checked={isPrimary}
                                        onChange={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            primaryDepartment: dept._id
                                          }));
                                        }}
                                        className="w-3 h-3 text-blue-600"
                                      />
                                      <span className="text-gray-700 dark:text-gray-300">Primary department</span>
                                    </label>
                                  </div>
                                )}
                                
                                {isPrimary && (
                                  <div className="absolute top-2 right-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      Primary
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {selectedDepartments.length > 0 && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>{selectedDepartments.length}</strong> department{selectedDepartments.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        No departments available. Admins can create departments under Departments section.
                      </div>
                    )}
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Are you born again?
                      </label>
                      <select
                        name="bornAgain"
                        value={formData.bornAgain === null ? '' : String(formData.bornAgain)}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                  </div>

                  {/* Baptism Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Baptism Status
                    </label>
                    <select
                      name="baptismStatus"
                      value={formData.baptismStatus || 'none'}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="none">None</option>
                      <option value="water">Water Baptism</option>
                      <option value="holyGhost">Holy Ghost Baptism</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  {/* How Did You Join */}
                  <div className="mt-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How did you join {merchant?.name || 'the church'}?
                    </label>
                    <select
                      name="howDidYouJoin"
                      value={formData.howDidYouJoin || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select...</option>
                      <option value="invitation">Invitation</option>
                      <option value="social_media">Social Media</option>
                      <option value="church_event">Church Event</option>
                      <option value="walk_in">Walk-in</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Show "Other" text field if "Other" is selected */}
                  {formData.howDidYouJoin === 'other' && (
                    <div className="mt-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Please specify how you joined
                      </label>
                      <input
                        type="text"
                        name="howDidYouJoinOther"
                        value={formData.howDidYouJoinOther || ''}
                        onChange={handleChange}
                        maxLength={200}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Please specify..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.howDidYouJoinOther?.length || 0}/200 characters
                      </p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors resize-none"
                      placeholder="Additional notes about the member"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/members/all')}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Member
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      </FeatureGate>
    </PermissionRoute>
  );
};

export default NewMember;