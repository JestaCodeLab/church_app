import React, { useState } from 'react';
import { X, UserCircle, Users, Mic } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  photo?: string;
}

interface ExternalSpeakerData {
  name: string;
  title: string;
  organization: string;
  photo?: string;
  bio?: string;
  topic?: string;
}

interface AddSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMemberSpeaker: (memberId: string) => void;
  onAddExternalSpeaker: (speakerData: ExternalSpeakerData) => void;
  members: Member[];
  existingSpeakers: any[];
}

const AddSpeakerModal: React.FC<AddSpeakerModalProps> = ({
  isOpen,
  onClose,
  onAddMemberSpeaker,
  onAddExternalSpeaker,
  members,
  existingSpeakers
}) => {
  const [speakerType, setSpeakerType] = useState<'member' | 'external'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalSpeakerForm, setExternalSpeakerForm] = useState<ExternalSpeakerData>({
    name: '',
    title: '',
    organization: '',
    bio: '',
    topic: ''
  });

  if (!isOpen) return null;

  // Filter members based on search and exclude already added speakers
  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         member.phone.includes(searchQuery) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if member is already a speaker
    const isAlreadySpeaker = existingSpeakers.some(speaker => 
      speaker.type === 'member' && speaker.member?._id === member._id
    );
    
    return matchesSearch && !isAlreadySpeaker;
  });

  const handleAddMemberSpeaker = (memberId: string) => {
    onAddMemberSpeaker(memberId);
    setSearchQuery('');
  };

  const handleAddExternalSpeaker = () => {
    if (!externalSpeakerForm.name || !externalSpeakerForm.title) {
      return;
    }
    onAddExternalSpeaker(externalSpeakerForm);
    setExternalSpeakerForm({
      name: '',
      title: '',
      organization: '',
      bio: '',
      topic: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <Mic className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Add Service Speaker
              </h3>
            </div>
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
              onClick={() => setSpeakerType('member')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                speakerType === 'member'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Church Member</span>
            </button>
            <button
              onClick={() => setSpeakerType('external')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                speakerType === 'external'
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
          {speakerType === 'member' ? (
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
                      onClick={() => handleAddMemberSpeaker(member._id)}
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
              {/* External Speaker Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={externalSpeakerForm.name}
                  onChange={(e) => setExternalSpeakerForm({ ...externalSpeakerForm, name: e.target.value })}
                  placeholder="e.g., Dr. Sarah Smith"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title/Position *
                </label>
                <input
                  type="text"
                  value={externalSpeakerForm.title}
                  onChange={(e) => setExternalSpeakerForm({ ...externalSpeakerForm, title: e.target.value })}
                  placeholder="e.g., Bible Teacher, Evangelist"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  value={externalSpeakerForm.organization}
                  onChange={(e) => setExternalSpeakerForm({ ...externalSpeakerForm, organization: e.target.value })}
                  placeholder="e.g., Theological Seminary"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Speaking Topic (Optional)
                </label>
                <input
                  type="text"
                  value={externalSpeakerForm.topic}
                  onChange={(e) => setExternalSpeakerForm({ ...externalSpeakerForm, topic: e.target.value })}
                  placeholder="e.g., Understanding the Prophets"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio (Optional)
                </label>
                <textarea
                  value={externalSpeakerForm.bio}
                  onChange={(e) => setExternalSpeakerForm({ ...externalSpeakerForm, bio: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              <button
                onClick={handleAddExternalSpeaker}
                disabled={!externalSpeakerForm.name || !externalSpeakerForm.title}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Add External Speaker
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

export default AddSpeakerModal;