import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2, Users, Clock, Wifi, UserPlus } from 'lucide-react';
import { branchAPI, memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import FeatureGate from '../../../components/access/FeatureGate';
import { validatePhone, validateEmail } from '../../../utils/validators';

const NewBranch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [hasPastors, setHasPastors] = useState(true);
  const [serviceTimes, setServiceTimes] = useState<any[]>([
    { day: 'Sunday', service: 'Morning Service', startTime: '09:00', endTime: '11:00' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'branch' as 'main' | 'branch' | 'campus' | 'satellite',
    email: '',
    phone: '',
    alternatePhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      region: '',
      country: 'Ghana',
      postalCode: '',
      landmark: ''
    },
    pastor: '',
    assistant: '',
    leaders: [] as string[],
    facilities: {
      capacity: '',
      parking: {
        available: false,
        spaces: ''
      },
      childcare: false,
      accessibility: {
        wheelchair: false,
        elevator: false,
        assistiveListening: false
      },
      amenities: [] as string[]
    },
    coordinates: {
      latitude: '',
      longitude: ''
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      website: ''
    },
    description: '',
    notes: '',
    establishedDate: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
  try {
    const response = await memberAPI.getMembers({
      page: 1,
      limit: 1000,
      status: 'active'
    });
    setMembers(response.data.data.members);
    
    // Check if there are any pastors/leaders
    const pastorsAndLeaders = response.data.data.members.filter((m: any) => 
      ['pastor', 'elder', 'leader'].includes(m.membershipType)
    );
    setHasPastors(pastorsAndLeaders.length > 0);
    
  } catch (error) {
    console.error('Failed to load members');
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      if (subChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof formData] as Record<string, any>),
            [child]: {
              ...((prev[parent as keyof typeof formData] as Record<string, any>)[child] as Record<string, any>),
              [subChild]: type === 'number' ? (value ? parseInt(value) : '') : value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof formData] as Record<string, any>),
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (name: string) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof formData] as Record<string, any>) || {}),
          [child]: !(prev[parent as keyof typeof formData] as any)[child]
        }
      }));
    }
  };

  const handleLeaderToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      leaders: prev.leaders.includes(memberId)
        ? prev.leaders.filter(id => id !== memberId)
        : [...prev.leaders, memberId]
    }));
  };

  const addServiceTime = () => {
    setServiceTimes([...serviceTimes, { day: 'Sunday', service: '', startTime: '', endTime: '' }]);
  };

  const removeServiceTime = (index: number) => {
    setServiceTimes(serviceTimes.filter((_, i) => i !== index));
  };

  const updateServiceTime = (index: number, field: string, value: string) => {
    const updated = [...serviceTimes];
    updated[index] = { ...updated[index], [field]: value };
    setServiceTimes(updated);
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        facilities: {
          ...prev.facilities,
          amenities: [...prev.facilities.amenities, amenityInput.trim()]
        }
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        amenities: prev.facilities.amenities.filter((_, i) => i !== index)
      }
    }));
  };

  const validate = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = 'Branch name is required';
    if (!formData.code.trim()) newErrors.code = 'Branch code is required';
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast.error('Please fill in all required fields');
      return;
    }

    // validate email and phone
    const emailValidation = validateEmail(formData.email);
    if (formData.email && !emailValidation.valid) {
      showToast.error('Please enter a valid email address');
      return;
    }
    const phoneValidation = validatePhone(formData.phone);
    if (formData.phone && !phoneValidation.valid) {
      showToast.error('Please enter a valid phone number');
      return;
    }


    setLoading(true);

    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        serviceTimes: serviceTimes.filter(st => st.service && st.startTime),
        facilities: {
          ...formData.facilities,
          capacity: formData.facilities.capacity ? parseInt(formData.facilities.capacity as any) : undefined,
          parking: {
            available: formData.facilities.parking.available,
            spaces: formData.facilities.parking.spaces ? parseInt(formData.facilities.parking.spaces as any) : undefined
          }
        },
        coordinates: {
          latitude: formData.coordinates.latitude ? parseFloat(formData.coordinates.latitude as any) : undefined,
          longitude: formData.coordinates.longitude ? parseFloat(formData.coordinates.longitude as any) : undefined
        },
        pastor: formData.pastor || undefined,
        assistant: formData.assistant || undefined,
        leaders: formData.leaders.length > 0 ? formData.leaders : undefined
      };

      await branchAPI.createBranch(submitData);
      showToast.success('Branch created successfully');
      navigate('/branches');
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <FeatureGate feature={'branchManagement'}>
    <div className="min-h-screen dark:bg-gray-900">
      {/* Header */}
      <div className=" dark:bg-gray-900 border-gray-200 rounded-lg dark:border-gray-700 px-6 py-4">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/branches')}
            className="p-2 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Add New Branch
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create a new church location or campus
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-8xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border ${
                    errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  } rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100`}
                  placeholder="e.g., Accra Central Branch"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border ${
                    errors.code ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  } rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 uppercase`}
                  placeholder="e.g., ACC"
                  maxLength={10}
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  A unique identifier for this branch
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                >
                  <option value="main">Main</option>
                  <option value="branch">Branch</option>
                  <option value="campus">Campus</option>
                  <option value="satellite">Satellite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Established Date
                </label>
                <input
                  type="date"
                  name="establishedDate"
                  value={formData.establishedDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="branch@church.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="+233 123 456 789"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="+233 987 654 321"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Address
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border ${
                    errors['address.street'] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  } rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100`}
                  placeholder="123 Main Street"
                />
                {errors['address.street'] && <p className="text-red-500 text-xs mt-1">{errors['address.street']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border ${
                    errors['address.city'] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  } rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100`}
                  placeholder="Accra"
                />
                {errors['address.city'] && <p className="text-red-500 text-xs mt-1">{errors['address.city']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Region
                </label>
                <input
                  type="text"
                  name="address.region"
                  value={formData.address.region}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Greater Accra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Optional"
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
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="00233"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Landmark
                </label>
                <input
                  type="text"
                  name="address.landmark"
                  value={formData.address.landmark}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Near Makola Market"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="coordinates.latitude"
                  value={formData.coordinates.latitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="5.6037"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="coordinates.longitude"
                  value={formData.coordinates.longitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="-0.1870"
                />
              </div>
            </div>
          </div>

          {/* Leadership */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Leadership
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pastor
                </label>
                <select
                  name="pastor"
                  value={formData.pastor}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Pastor</option>
                  {members
                    .filter(m => ['pastor', 'elder', 'leader'].includes(m.membershipType))
                    .map(member => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assistant Pastor
                </label>
                <select
                  name="assistant"
                  value={formData.assistant}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Assistant</option>
                  {members
                    .filter(m => ['pastor', 'elder', 'leader'].includes(m.membershipType))
                    .map(member => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Leaders
                </label>
                <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  {members
                    .filter(m => ['pastor', 'elder', 'leader', 'deacon'].includes(m.membershipType))
                    .map(member => (
                      <label key={member._id} className="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-600 px-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.leaders.includes(member._id)}
                          onChange={() => handleLeaderToggle(member._id)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="ml-3 text-sm capitalize text-gray-700 dark:text-gray-300">
                          {member.firstName} {member.lastName} - {member.membershipType}
                        </span>
                      </label>
                    ))}
                  {members.filter(m => ['pastor', 'elder', 'leader', 'deacon'].includes(m.membershipType)).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No leaders available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Times */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Service Times
                </h2>
              </div>
              <button
                type="button"
                onClick={addServiceTime}
                className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                + Add Service
              </button>
            </div>

            <div className="space-y-4">
              {serviceTimes.map((serviceTime, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Day
                    </label>
                    <select
                      value={serviceTime.day}
                      onChange={(e) => updateServiceTime(index, 'day', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    >
                      {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Service Name
                    </label>
                    <input
                      type="text"
                      value={serviceTime.service}
                      onChange={(e) => updateServiceTime(index, 'service', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                      placeholder="e.g., Morning Service"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={serviceTime.startTime}
                      onChange={(e) => updateServiceTime(index, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex items-end">
                    <input
                      type="time"
                      value={serviceTime.endTime}
                      onChange={(e) => updateServiceTime(index, 'endTime', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                      placeholder="End"
                    />
                    {serviceTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceTime(index)}
                        className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Wifi className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Facilities & Amenities
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    name="facilities.capacity"
                    value={formData.facilities.capacity}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    placeholder="e.g., 300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parking Spaces
                  </label>
                  <input
                    type="number"
                    name="facilities.parking.spaces"
                    value={formData.facilities.parking.spaces}
                    onChange={handleChange}
                    disabled={!formData.facilities.parking.available}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 disabled:opacity-50"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities.parking.available}
                    onChange={() => handleCheckboxChange('facilities.parking.available')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Parking Available
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities.childcare}
                    onChange={() => handleCheckboxChange('facilities.childcare')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Childcare Available
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities.accessibility.wheelchair}
                    onChange={() => handleCheckboxChange('facilities.accessibility.wheelchair')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Wheelchair Accessible
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities.accessibility.elevator}
                    onChange={() => handleCheckboxChange('facilities.accessibility.elevator')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Elevator Available
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities.accessibility.assistiveListening}
                    onChange={() => handleCheckboxChange('facilities.accessibility.assistiveListening')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Assistive Listening System
                  </span>
                </label>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Amenities
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    placeholder="e.g., WiFi, Air Conditioning"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.facilities.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="hover:text-primary-900 dark:hover:text-primary-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Social Media & Website
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube
                </label>
                <input
                  type="url"
                  name="socialMedia.youtube"
                  value={formData.socialMedia.youtube}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="socialMedia.website"
                  value={formData.socialMedia.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Additional Information
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Brief description about this branch..."
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Internal Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Private notes (not visible to members)..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.notes.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/branches')}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Branch'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
    </FeatureGate>
  );
};

export default NewBranch;