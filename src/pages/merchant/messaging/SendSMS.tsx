import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Users,
  Phone,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  MessageSquare,
  CreditCard,
  Info,
  Search,
  Clock,
  Calendar,
  Wand2,
  ChevronDown,
  ChevronUp,
  Lock
} from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { merchantAPI, partnershipAPI } from '../../../services/api';
import { memberAPI, departmentAPI, branchAPI, messagingAPI } from '../../../services/api';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import FeatureGate from '../../../components/access/FeatureGate';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface Department {
  _id: string;
  name: string;
  memberCount: number;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
}

interface Template {
  _id: string;
  name: string;
  message: string;
  category: string;
  variables?: string[];
}

interface Credits {
  balance: number;
  merchantId: string;
}

interface PartnershipProgramme {
  _id: string;
  name: string;
  stats?: {
    totalPartners?: number;
  };
}

interface PartnershipPartner {
  _id: string;
  partnerType: 'member' | 'guest';
  partner: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  member?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface SenderIdStatus {
  hasCustomSenderId: boolean;
  customSenderId: string | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  effectiveSenderId: string;
  platformSenderId: string;
}

type SendType = 'single' | 'bulk' | 'members' | 'department' | 'branch' | 'all' | 'partnership';

const SendSMS = () => {
  // Send type and recipients
  const [sendType, setSendType] = useState<SendType>('single');
  const [phone, setPhone] = useState('');
  const [phones, setPhones] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // ✅ Member search state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [searchingMembers, setSearchingMembers] = useState(false);
  const memberSearchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Message
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // ✅ Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  // ✅ AI Generation
  const [messageTab, setMessageTab] = useState<'write' | 'ai'>('write');
  const [aiTone, setAiTone] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState(''); // For typewriter effect
  const [isTyping, setIsTyping] = useState(false); // Track if currently typing

  // Data
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [senderIdStatus, setSenderIdStatus] = useState<SenderIdStatus | null>(null);
  const [partnerships, setPartnerships] = useState<PartnershipProgramme[]>([]);
  const [selectedPartnership, setSelectedPartnership] = useState('');
  const [partnershipPartners, setPartnershipPartners] = useState<PartnershipPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchSenderIdStatus();
  }, []);


  // ✅ Debounced member search
  useEffect(() => {
    if (sendType !== 'members') return;

    if (memberSearchTimeoutRef.current) {
      clearTimeout(memberSearchTimeoutRef.current);
    }

    memberSearchTimeoutRef.current = setTimeout(() => {
      fetchMembers(memberSearchTerm);
    }, 300);

    return () => {
      if (memberSearchTimeoutRef.current) {
        clearTimeout(memberSearchTimeoutRef.current);
      }
    };
  }, [memberSearchTerm, sendType]);

  // ✅ Typewriter effect for AI-generated messages
  useEffect(() => {
    if (!isTyping || displayedMessage.length >= message.length) {
      if (displayedMessage.length === message.length && isTyping) {
        setIsTyping(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedMessage(message.substring(0, displayedMessage.length + 1));
    }, 30); // 30ms per character for smooth typing effect

    return () => clearTimeout(timer);
  }, [displayedMessage, message, isTyping]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsRes, branchesRes, templatesRes, creditsRes, partnershipsRes] = await Promise.all([
        departmentAPI.getDepartments(),
        branchAPI.getBranches({ limit: 100 }),
        messagingAPI.templates.getAll(),
        messagingAPI.credits.get(),
        partnershipAPI.getAll({})
      ]);

      setDepartments(deptsRes.data.data.departments || []);
      setBranches(branchesRes.data.data.branches || []);
      setTemplates(templatesRes.data.data.templates || []);
      setCredits(creditsRes.data.data.credits);
      setPartnerships(partnershipsRes.data.data.programmes || []);
    } catch (error: any) {
      showToast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch members with API search - accepts optional search parameter
  const fetchMembers = async (searchTerm: string = '') => {
    try {
      setSearchingMembers(true);
      const response = await memberAPI.getMembers({
        limit: 5000,
        search: searchTerm || undefined,
        status: 'active'
      });
      setMembers(response.data.data.members || []);
    } catch (error: any) {
      showToast.error('Failed to load members');
      console.error(error);
    } finally {
      setSearchingMembers(false);
    }
  };

  const fetchSenderIdStatus = async () => {
    try {
      const response = await merchantAPI.getSenderIDStatus();
      setSenderIdStatus(response.data.data);
    } catch (error) {
      console.log('Sender ID not configured');
    }
  };

  // Fetch partners for selected partnership
  const fetchPartnershipPartners = async (partnershipId: string) => {
    try {
      setLoadingPartners(true);
      const response = await partnershipAPI.getPartners(partnershipId, { limit: 5000 });
      setPartnershipPartners(response.data.data.partners || []);
    } catch (error: any) {
      showToast.error('Failed to load partnership partners');
      console.error(error);
      setPartnershipPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  };

  // Handle partnership selection
  const handlePartnershipSelect = (partnershipId: string) => {
    setSelectedPartnership(partnershipId);
    setSelectedMembers([]); // Clear previous selections
    if (partnershipId) {
      fetchPartnershipPartners(partnershipId);
    } else {
      setPartnershipPartners([]);
    }
  };

  // ✅ AI Message Generation
  const handleGenerateMessage = async () => {
    if (!aiTone.trim()) {
      showToast.error('Please provide context or tone for your message');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await messagingAPI.generateMessage({
        tone: aiTone
      });

      if (response.data.success) {
        const generatedText = response.data.data.message;
        setMessage(generatedText); // Set full message
        setDisplayedMessage(''); // Reset displayed message
        setIsTyping(true); // Start typewriter effect
        showToast.success('Message generated! Typing...');
        // Don't close the generator - keep it open in case user wants to regenerate
      } else {
        showToast.error(response.data.message || 'Failed to generate message');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      showToast.error(error.response?.data?.message || 'Failed to generate message');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setMessage(template.message);
      setCategory(template.category);
    }
  };

  // ✅ Clear states when send type changes
  const handleSendTypeChange = (newType: SendType) => {
    setSendType(newType);

    // Clear all recipient-specific states
    setPhone('');
    setPhones('');
    setSelectedMembers([]);
    setSelectedDepartment('');
    setSelectedBranch('');
    setMemberSearchTerm('');

    // Load members if switching to members type or all type - pass empty string explicitly
    if (newType === 'members' || newType === 'all') {
      fetchMembers('');
    }
  };

  const getRecipientCount = (): number => {
    switch (sendType) {
      case 'single':
        return phone ? 1 : 0;
      case 'bulk':
        return phones.split('\n').filter(p => p.trim()).length;
      case 'members':
        return selectedMembers.length;
      case 'department':
        const dept = departments.find(d => d._id === selectedDepartment);
        return dept?.memberCount || 0;
      case 'branch':
        return members.filter(m => m).length;
      case 'partnership':
        return selectedMembers.length;
      case 'all':
        return members.length;
      default:
        return 0;
    }
  };

  const calculateCredits = (messageText: string, recipients: number): number => {
    const messageLength = messageText.length;
    let segments = 1;

    if (messageLength <= 160) {
      segments = 1;
    } else {
      segments = Math.ceil(messageLength / 153);
    }

    return segments * recipients;
  };

  const creditsNeeded = calculateCredits(message, getRecipientCount());
  const hasInsufficientCredits = credits ? creditsNeeded > credits.balance : false;

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showToast.error('Message is required');
      return;
    }

    if (hasInsufficientCredits) {
      showToast.error(`Insufficient credits. You need ${creditsNeeded} but have ${credits?.balance || 0}`);
      return;
    }

    // ✅ Validate scheduled time
    if (isScheduled && !scheduledDate) {
      showToast.error('Please select a date for the scheduled message');
      return;
    }

    if (isScheduled) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        showToast.error('Scheduled time must be in the future');
        return;
      }
    }

    if (sendType === 'all') {
      setConfirmData({
        title: 'Send to All Members',
        message: `Are you sure you want to send SMS to all ${members.length} members? This will use ${creditsNeeded} credits.${isScheduled ? ` Message will be sent on ${new Date(scheduledDate + 'T' + scheduledTime).toLocaleString()}.` : ''}`,
        onConfirm: () => {
          setShowConfirmModal(false);
          executeSend();
        }
      });
      setShowConfirmModal(true);
      return;
    }

    await executeSend();
  };

  const executeSend = async () => {
    setSending(true);

    try {
      let response;

      switch (sendType) {
        case 'single':
          if (!phone) {
            showToast.error('Phone number is required');
            return;
          }
          response = await messagingAPI.sms.send({
            phone,
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined
          });
          break;

        case 'bulk':
          const phoneArray = phones.split('\n').filter(p => p.trim());
          if (phoneArray.length === 0) {
            showToast.error('At least one phone number is required');
            return;
          }
          response = await messagingAPI.sms.sendBulk({
            phones: phoneArray,
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined
          });
          break;

        case 'members':
          if (selectedMembers.length === 0) {
            showToast.error('Select at least one member');
            return;
          }
          response = await messagingAPI.sms.sendToMembers({
            memberIds: selectedMembers,
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined
          });
          break;

        case 'department':
          if (!selectedDepartment) {
            showToast.error('Select a department');
            return;
          }
          response = await messagingAPI.sms.sendToDepartment({
            departmentId: selectedDepartment,
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined
          });
          break;

        case 'branch':
          if (!selectedBranch) {
            showToast.error('Select a branch');
            return;
          }
          response = await messagingAPI.sms.sendToBranch({
            branchId: selectedBranch,
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined
          });
          break;

        case 'partnership':
          if (!selectedPartnership) {
            showToast.error('Select a partnership programme');
            return;
          }
          if (selectedMembers.length === 0) {
            showToast.error('Select at least one partner');
            return;
          }
          const partnershipPhones = [];
          const partnershipNames = [];
          const partnershipFirstNames = [];
          const partnershipLastNames = [];

          selectedMembers.forEach(partnerId => {
            const partner = partnershipPartners.find(p => p._id === partnerId);
            if (!partner) return;

            const phone = partner.partnerType === 'member' && partner.member
              ? partner.member.phone
              : partner.partner?.phone;

            const firstName = partner.partnerType === 'member' && partner.member
              ? partner.member.firstName
              : partner.partner?.firstName || '';

            const lastName = partner.partnerType === 'member' && partner.member
              ? partner.member.lastName
              : partner.partner?.lastName || '';

            if (phone) {
              partnershipPhones.push(phone);
              partnershipNames.push(`${firstName} ${lastName}`.trim());
              partnershipFirstNames.push(firstName);
              partnershipLastNames.push(lastName);
            }
          });

          response = await messagingAPI.sms.sendBulk({
            phones: partnershipPhones,
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined,
            metadata: {
              partnershipProgrammeId: selectedPartnership,
              recipientNames: partnershipNames,
              firstNames: partnershipFirstNames,
              lastNames: partnershipLastNames
            }
          });
          break;

        case 'all':
          response = await messagingAPI.sms.sendToAll({
            message,
            category,
            templateId: selectedTemplate || undefined,
            scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined
          });
          break;

        default:
          showToast.error('Invalid send type');
          return;
      }

      if (response.data.success) {
        const data = response.data.data;

        showToast.success(
          `SMS ${isScheduled ? 'scheduled' : 'sent'} successfully! 
           ${data.successCount ? `Sent to ${data.successCount} recipients` : 'Message submitted'}
           Credits used: ${data.creditsUsed || creditsNeeded}
           ${isScheduled ? `\nWill be delivered on ${new Date(scheduledDate + 'T' + scheduledTime).toLocaleString()}` : ''}
           
           Delivery status will update shortly.`
        );

        // Reset form
        setMessage('');
        setPhone('');
        setPhones('');
        setSelectedMembers([]);
        setSelectedDepartment('');
        setSelectedBranch('');
        setSelectedPartnership('');
        setPartnershipPartners([]);
        setSelectedTemplate('');
        setMemberSearchTerm('');
        setSendType('single');
        setIsScheduled(false);
        setScheduledDate('');
        setScheduledTime('09:00');

        // Refresh credits
        const creditsRes = await messagingAPI.credits.get();
        setCredits(creditsRes.data.data.credits);
      } else {
        showToast.error(response.data.message || 'Failed to send SMS');
      }

    } catch (error: any) {
      console.error('Send SMS error:', error);
      showToast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <FeatureGate feature="smsSend">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Send SMS
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send messages to your members
            </p>
          </div>

          {/* Credits Display */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-base text-gray-600 dark:text-gray-400">Available Credits: {credits?.balance || 0}</p>
            </div>
            <Link
              to="/messaging/credits"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Buy Credits</span>
            </Link>
          </div>
        </div>

        {/* Sender ID Status */}
        {senderIdStatus && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Sending as:</strong> {senderIdStatus.effectiveSenderId}
                </p>
                {senderIdStatus.status === 'pending' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Your custom sender ID <b>"{senderIdStatus.customSenderId}"</b> is pending approval
                  </p>
                )}
                {senderIdStatus.status === 'none' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Want to use your church name? {' '}
                    <Link to="/messaging/sender-id" className="underline font-medium">
                      Register a custom sender ID
                    </Link>
                  </p>
                )}
                {senderIdStatus.status === 'approved' && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✅ Using your custom sender ID
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendSMS} className="p-6 space-y-6">
            {/* Send Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Send To
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { value: 'single', label: 'Single', icon: Phone },
                  { value: 'bulk', label: 'Bulk', icon: MessageSquare },
                  { value: 'members', label: 'Members', icon: Users },
                  { value: 'department', label: 'Department', icon: Building2 },
                  { value: 'branch', label: 'Branch', icon: Building2 },
                  { value: 'partnership', label: 'Partnership', icon: Users },
                  { value: 'all', label: 'All Members', icon: Users }
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleSendTypeChange(type.value as SendType)}
                      className={`p-3 rounded-lg border-2 transition-all ${sendType === type.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Input Based on Send Type */}
            <div>
              {sendType === 'single' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="055XXXXXXX or 23355XXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter phone number in local (0...) or international (233...) format
                  </p>
                </div>
              )}

              {sendType === 'bulk' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Numbers (one per line)
                  </label>
                  <textarea
                    value={phones}
                    onChange={(e) => setPhones(e.target.value)}
                    placeholder="0557228597&#10;0241234567&#10;0209876543"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {phones.split('\n').filter(p => p.trim()).length} phone number(s)
                  </p>
                </div>
              )}

              {sendType === 'members' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Members
                  </label>

                  {/* ✅ Search Input */}
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search members by name, email, or phone..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                      />
                      {searchingMembers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto bg-white dark:bg-gray-700">
                    {searchingMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-primary-600" />
                      </div>
                    ) : members.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {memberSearchTerm ? 'No members found matching your search' : 'No members available'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <label className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMembers.length === members.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers(members.map(m => m._id));
                              } else {
                                setSelectedMembers([]);
                              }
                            }}
                            className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Select All ({members.length})
                          </span>
                        </label>
                        <hr className="border-gray-200 dark:border-gray-600" />
                        {members.map((member) => (
                          <label
                            key={member._id}
                            className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([...selectedMembers, member._id]);
                                } else {
                                  setSelectedMembers(selectedMembers.filter(id => id !== member._id));
                                }
                              }}
                              className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {member.firstName} {member.lastName} - {member.phone}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {selectedMembers.length} member(s) selected
                  </p>
                </div>
              )}

              {sendType === 'department' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                    required
                  >
                    <option value="">Choose a department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.memberCount || 0} members)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sendType === 'branch' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                    required
                  >
                    <option value="">Choose a branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sendType === 'partnership' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Partnership Programme
                    </label>
                    <select
                      value={selectedPartnership}
                      onChange={(e) => handlePartnershipSelect(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                      required
                    >
                      <option value="">Choose a partnership programme</option>
                      {partnerships.map((prog) => (
                        <option key={prog._id} value={prog._id}>
                          {prog.name} ({prog.stats?.totalPartners || 0} partners)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPartnership && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Partners
                      </label>
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto bg-white dark:bg-gray-700">
                        {loadingPartners ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader className="w-6 h-6 animate-spin text-primary-600" />
                          </div>
                        ) : partnershipPartners.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No partners found in this programme
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <label className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedMembers.length === partnershipPartners.length && partnershipPartners.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMembers(partnershipPartners.map(p => p._id));
                                  } else {
                                    setSelectedMembers([]);
                                  }
                                }}
                                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Select All ({partnershipPartners.length})
                              </span>
                            </label>
                            <hr className="border-gray-200 dark:border-gray-600" />
                            {partnershipPartners.map((partner) => {
                              const name = partner.partnerType === 'member' && partner.member
                                ? `${partner.member.firstName} ${partner.member.lastName}`
                                : `${partner.partner?.firstName} ${partner.partner?.lastName}`;
                              const phone = partner.partnerType === 'member' && partner.member
                                ? partner.member.phone
                                : partner.partner?.phone;

                              return (
                                <label
                                  key={partner._id}
                                  className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(partner._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMembers([...selectedMembers, partner._id]);
                                      } else {
                                        setSelectedMembers(selectedMembers.filter(id => id !== partner._id));
                                      }
                                    }}
                                    className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {name} - {phone}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {selectedMembers.length} partner(s) selected
                      </p>
                    </div>
                  )}
                </div>
              )}

              {sendType === 'all' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                        Send to All Members
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        This will send the message to all {members.length} active members.
                        This will use {creditsNeeded} credits.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Template Selection - Hide for 'single' send type */}
            {sendType !== 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Use Template (Optional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>

                {selectedTemplate && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-2">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Variables will be auto-filled:
                      {templates?.find(t => t._id === selectedTemplate)?.variables?.join(', ')}
                    </p>
                  </div>
                )}
                {templates.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No templates available. <Link to="/messaging/templates" className="text-primary-600 hover:underline">Create one</Link>
                  </p>
                )}
              </div>
            )}

            {/* ✅ Message Section with Tabs */}
            <div>
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                  type="button"
                  onClick={() => setMessageTab('write')}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${messageTab === 'write'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Write it myself
                </button>

                <button
                  type="button"
                  disabled={true}
                  className="px-4 py-3 font-medium text-sm transition-colors border-b-2 opacity-50 cursor-not-allowed border-transparent text-gray-400 dark:text-gray-500"
                  title="AI SMS generation is not available in your plan"
                >
                  <Lock className="w-4 h-4 inline mr-2" />
                  Use AI
                </button>
              </div>

              {/* Write Message Tab */}
              {messageTab === 'write' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={5}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {message.length}/500 characters
                      {message.length > 160 && (
                        <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                          • {Math.ceil(message.length / 153)} SMS parts
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Use AI Tab */}
              {messageTab === 'ai' && (
                <div className="space-y-4">
                  {/* AI Generation Form */}
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Context or Tone
                      </label>
                      <textarea
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        placeholder="e.g. Invite to Sunday service in a friendly manner..."
                        rows={4}
                        className="w-full px-4 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Describe what you'd like the message to convey or how you want it to sound
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateMessage}
                      disabled={generatingAI || !aiTone.trim()}
                      className="px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                    >
                      {generatingAI ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Generate Message →</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Generated Message Display */}
                  {message && (
                    <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Your Message
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed mb-3">
                        {message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {message.length}/500 characters
                        {message.length > 160 && (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                            • {Math.ceil(message.length / 153)} SMS parts
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
              >
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="announcement">Announcement</option>
                <option value="reminder">Reminder</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* ✅ Schedule Message */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => {
                    setIsScheduled(e.target.checked);
                    if (!e.target.checked) {
                      setScheduledDate('');
                      setScheduledTime('09:00');
                    }
                  }}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Schedule this message for later
                  </span>
                </div>
              </label>

              {/* ✅ Scheduled Date/Time Inputs */}
              {isScheduled && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>

                  {scheduledDate && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-blue-900 dark:text-blue-100">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        <strong>Scheduled for:</strong> {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Credits Summary */}
            <div className={`${hasInsufficientCredits ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-50 dark:bg-gray-900'} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                    Credits Required
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0">
                    {getRecipientCount()} recipient(s) × {message.length > 160 ? Math.ceil(message.length / 153) : 1} SMS part(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {creditsNeeded}
                  </p>
                  {hasInsufficientCredits && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Insufficient credits
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setPhone('');
                  setPhones('');
                  setSelectedMembers([]);
                  setSelectedDepartment('');
                  setSelectedBranch('');
                  setSelectedTemplate('');
                  setMemberSearchTerm('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Clear
              </button>

              {/* ✅ Updated button styling for disabled state */}
              <button
                type="submit"
                disabled={sending || !message.trim() || hasInsufficientCredits}
                className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors ${sending || !message.trim() || hasInsufficientCredits
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
              >
                {sending ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {isScheduled ? (
                      <>
                        <Clock className="w-5 h-5" />
                        <span>Schedule SMS</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send SMS</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Quick Tips:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Messages over 160 characters will be sent as multiple SMS parts</li>
                <li>Delivery status updates automatically within 30 seconds</li>
                <li>Check SMS History to see delivery status per recipient</li>
                <li>Custom sender IDs make your messages more recognizable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && confirmData && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmData.onConfirm}
          title={confirmData.title}
          message={confirmData.message}
          confirmText="Yes, Send SMS"
          cancelText="Cancel"
          type="warning"
          isLoading={sending}
        />
      )}
    </FeatureGate>
  );
};

export default SendSMS;