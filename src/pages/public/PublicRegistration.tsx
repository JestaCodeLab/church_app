import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, UserPlus, CheckCircle, Mail, Phone, MapPin, Calendar, User, Clock, XCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const PublicRegistrationPage = () => {
  const { merchantId } = useParams();
  
  // Registration status state
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  
  // Merchant info
  const [merchantInfo, setMerchantInfo] = useState({
    name: '',
    logo: null
  });

  // Form state
  const [registrationType, setRegistrationType] = useState(null); // 'member' or 'first-timer'
  const [formData, setFormData] = useState({
    // Common fields
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    email: '',
    dateOfBirth: '',
    maritalStatus: '',
    occupation: '',
    address: {
      street: '',
      city: '',
      region: '',
      country: 'Ghana'
    },
    placeOfWork: '',
    bornAgain: null,
    baptismStatus: 'none',
    howDidYouJoin: '',
    howDidYouJoinOther: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check registration status on mount
  useEffect(() => {
    checkRegistrationStatus();
  }, [merchantId]);

  const checkRegistrationStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await axios.get(`${API_URL}/public/register/${merchantId}/status`);
      
      if (response.data.success) {
        setRegistrationStatus(response.data.data);
        setMerchantInfo({
          name: response.data.data.merchantName,
          logo: response.data.data.merchantLogo
        });
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      toast.error('Failed to load registration information');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare submission data based on registration type
      const submissionData = {
        registrationType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        address: formData.address,
        occupation: formData.occupation,
        maritalStatus: formData.maritalStatus,
        dateOfBirth: formData.dateOfBirth,
        placeOfWork: formData.placeOfWork,
        bornAgain: formData.bornAgain,
        baptismStatus: formData.baptismStatus,
        howDidYouJoin: formData.howDidYouJoin,
        howDidYouJoinOther: formData.howDidYouJoinOther,
      };

      // Add member-specific fields
      if (registrationType === 'member') {
        if (formData.email) submissionData.email = formData.email;
        if (formData.dateOfBirth) submissionData.dateOfBirth = formData.dateOfBirth;
        if (formData.maritalStatus) submissionData.maritalStatus = formData.maritalStatus;
        if (formData.occupation) submissionData.occupation = formData.occupation;
        if (formData.placeOfWork) submissionData.placeOfWork = formData.placeOfWork;  
      }
      if (formData.bornAgain !== null) submissionData.bornAgain = formData.bornAgain;
      if (formData.baptismStatus) submissionData.baptismStatus = formData.baptismStatus;
      if (formData.howDidYouJoin) submissionData.howDidYouJoin = formData.howDidYouJoin;
      if (formData.howDidYouJoinOther) submissionData.howDidYouJoinOther = formData.howDidYouJoinOther;

      const response = await axios.post(
        `${API_URL}/public/register/${merchantId}`,
        submissionData
      );

      if (response.data.success) {
        toast.success('Registration submitted successfully!');
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegistrationType(null);
    setSubmitted(false);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      email: '',
      dateOfBirth: '',
      maritalStatus: '',
      occupation: '',
      address: {
        street: '',
        city: '',
        region: '',
        country: 'Ghana'
      },
      placeOfWork: '',
      bornAgain: null,
      baptismStatus: 'none',
      howDidYouJoin: '',
      howDidYouJoinOther: '',
    });
  };

  // Loading state
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Registration not accepting (paused, expired, scheduled, disabled)
  if (!registrationStatus?.isAcceptingRegistrations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Church Logo */}
          {merchantInfo.logo && (
            <div className="flex justify-center mb-6">
              <img 
                src={merchantInfo.logo} 
                alt={merchantInfo.name}
                className="h-20 w-20 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Church Name */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
            {merchantInfo.name}
          </h1>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {registrationStatus?.status === 'paused' && (
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            {registrationStatus?.status === 'expired' && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            )}
            {registrationStatus?.status === 'scheduled' && (
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            {registrationStatus?.status === 'paused' && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Registration Temporarily Paused
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We're not currently accepting new registrations online.
                </p>
              </>
            )}
            {registrationStatus?.status === 'expired' && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Registration Period Has Ended
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  The registration window for this campaign has closed.
                </p>
              </>
            )}
            {registrationStatus?.status === 'scheduled' && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Registration Opens Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Registration will be available starting:
                </p>
                {registrationStatus?.startDate && (
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {new Date(registrationStatus.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Please check back then!
                </p>
              </>
            )}
          </div>

          {/* Custom Message */}
          {registrationStatus?.customMessage && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {registrationStatus.customMessage}
              </p>
            </div>
          )}

          {/* Contact Information */}
          {(registrationStatus?.contactEmail || registrationStatus?.contactPhone) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                For assistance, please contact:
              </p>
              <div className="space-y-2">
                {registrationStatus?.contactEmail && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${registrationStatus.contactEmail}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {registrationStatus.contactEmail}
                    </a>
                  </div>
                )}
                {registrationStatus?.contactPhone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${registrationStatus.contactPhone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {registrationStatus.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Registration Successful!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for registering with {merchantInfo.name}. We look forward to seeing you!
          </p>
          
          <button
            onClick={resetForm}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Register Another Person
          </button>
        </div>
      </div>
    );
  }

  // Registration active - show forms
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {merchantInfo.logo && (
            <div className="flex justify-center mb-4">
              <img 
                src={merchantInfo.logo} 
                alt={merchantInfo.name}
                className="h-20 w-20 object-contain rounded-lg"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to {merchantInfo.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {registrationType 
              ? `Complete your ${registrationType === 'member' ? 'member' : 'first-timer'} registration below`
              : 'Please select your registration type'
            }
          </p>
          
          {/* Registration closes info */}
          {registrationStatus?.endDate && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
              <span className="text-sm text-amber-800 dark:text-amber-300">
                Registration closes: {new Date(registrationStatus.endDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Registration Type Selection */}
        {!registrationType && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Member Registration Card */}
            <button
              onClick={() => setRegistrationType('member')}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Member Registration
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  I'm joining as a new member of the church
                </p>
              </div>
            </button>

            {/* First-Timer Registration Card */}
            <button
              onClick={() => setRegistrationType('first-timer')}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <UserPlus className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  First-Timer
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  This is my first time visiting the church
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Registration Form */}
        {registrationType && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            {/* Back Button */}
            <button
              onClick={resetForm}
              className="mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
            >
              ← Back to selection
            </button>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 0241234567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Member-Specific Fields */}
              {registrationType === 'member' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Marital Status
                      </label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                        value={formData.occupation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Place of Work
                        </label>
                        <input
                        type="text"
                        name="placeOfWork"
                        value={formData.placeOfWork}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., ABC School, XYZ Company"
                        />
                    </div>
                  </div>
                </>
              )}

              

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    name="address.region"
                    value={formData.address.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              {registrationType === 'member' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Spiritual Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Born Again */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Are you born again?
                        </label>
                        <select
                            name="bornAgain"
                            value={formData.bornAgain === null ? '' : String(formData.bornAgain)}
                            onChange={(e) => {
                            const value = e.target.value === '' ? null : e.target.value === 'true';
                            setFormData(prev => ({ ...prev, bornAgain: value }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                            value={formData.baptismStatus}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="none">None</option>
                            <option value="water">Water Baptism</option>
                            <option value="holyGhost">Holy Ghost Baptism</option>
                            <option value="both">Both</option>
                        </select>
                        </div>
                    </div>

                    {/* How Did You Join */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        How did you join Saviours Embassy?
                        </label>
                        <select
                        name="howDidYouJoin"
                        value={formData.howDidYouJoin}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                        <option value="">Select...</option>
                        <option value="invitation">Invitation</option>
                        <option value="social_media">Social Media</option>
                        <option value="church_event">Church Event</option>
                        <option value="walk_in">Walk-in</option>
                        <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Show "Other" text field */}
                    {formData.howDidYouJoin === 'other' && (
                        <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Please specify how you joined
                        </label>
                        <input
                            type="text"
                            name="howDidYouJoinOther"
                            value={formData.howDidYouJoinOther}
                            onChange={handleInputChange}
                            maxLength={200}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Please specify..."
                        />
                        </div>
                    )}
                    </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRegistrationPage;