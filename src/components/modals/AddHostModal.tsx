import React, { useState } from 'react';
import { X, UserCircle, Users } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  photo?: string;
}

interface ExternalHostData {
  name: string;
  title: string;
  organization: string;
  photo?: string;
  bio?: string;
}

interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMemberHost: (memberId: string) => void;
  onAddExternalHost: (hostData: ExternalHostData) => void;
  members: Member[];
  existingHosts: any[];
}

const AddHostModal: React.FC<AddHostModalProps> = ({
  isOpen,
  onClose,
  onAddMemberHost,
  onAddExternalHost,
  members,
  existingHosts
}) => {
  const [hostType, setHostType] = useState<'member' | 'external'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalHostForm, setExternalHostForm] = useState<ExternalHostData>({
    name: '',
    title: '',
    organization: '',
    bio: ''
  });

  if (!isOpen) return null;

  // Filter members based on search and exclude already added hosts
  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         member.phone.includes(searchQuery) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if member is already a host
    const isAlreadyHost = existingHosts.some(host => 
      host.type === 'member' && host.member?._id === member._id
    );
    
    return matchesSearch && !isAlreadyHost;
  });

  const handleAddMemberHost = (memberId: string) => {
    onAddMemberHost(memberId);
    setSearchQuery('');
  };

  const handleAddExternalHost = () => {
    if (!externalHostForm.name || !externalHostForm.title) {
      return;
    }
    onAddExternalHost(externalHostForm);
    setExternalHostForm({
      name: '',
      title: '',
      organization: '',
      bio: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add Service Host
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Type Selection */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setHostType('member')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                hostType === 'member'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Church Member</span>
            </button>
            <button
              onClick={() => setHostType('external')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                hostType === 'external'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span>External Guest</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hostType === 'member' ? (
            <div className="space-y-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search members by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Member List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No members found matching your search' : 'No available members'}
                  </div>
                ) : (
                  filteredMembers.map(member => (
                    <button
                      key={member._id}
                      onClick={() => handleAddMemberHost(member._id)}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.phone}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* External Host Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={externalHostForm.name}
                  onChange={(e) => setExternalHostForm({ ...externalHostForm, name: e.target.value })}
                  placeholder="e.g., Pastor John Doe"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title/Position *
                </label>
                <input
                  type="text"
                  value={externalHostForm.title}
                  onChange={(e) => setExternalHostForm({ ...externalHostForm, title: e.target.value })}
                  placeholder="e.g., Senior Pastor, Evangelist"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  value={externalHostForm.organization}
                  onChange={(e) => setExternalHostForm({ ...externalHostForm, organization: e.target.value })}
                  placeholder="e.g., Faith Community Church"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio (Optional)
                </label>
                <textarea
                  value={externalHostForm.bio}
                  onChange={(e) => setExternalHostForm({ ...externalHostForm, bio: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              <button
                onClick={handleAddExternalHost}
                disabled={!externalHostForm.name || !externalHostForm.title}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Add External Host
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHostModal;