import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image,
  Link,
  Loader
} from 'lucide-react';
import { Announcement, AnnouncementSlide } from '../../types/announcement';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface SlideFormData {
  title: string;
  description: string;
  image: string | null;
  imagePublicId: string | null;
  imageFile: File | null;
  ctaButton: {
    label: string | null;
    url: string | null;
  };
  showCta: boolean;
}

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  announcement?: Announcement | null;
}

const emptySlide = (): SlideFormData => ({
  title: '',
  description: '',
  image: null,
  imagePublicId: null,
  imageFile: null,
  ctaButton: { label: null, url: null },
  showCta: false,
});

const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  announcement
}) => {
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<SlideFormData[]>([emptySlide()]);
  const [saving, setSaving] = useState(false);

  const isEditMode = !!announcement;

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      const sortedSlides = [...announcement.slides].sort((a, b) => a.order - b.order);
      setSlides(
        sortedSlides.map((s) => ({
          title: s.title,
          description: s.description,
          image: s.image,
          imagePublicId: s.imagePublicId,
          imageFile: null,
          ctaButton: {
            label: s.ctaButton?.label || null,
            url: s.ctaButton?.url || null,
          },
          showCta: !!(s.ctaButton?.label || s.ctaButton?.url),
        }))
      );
    } else {
      setTitle('');
      setSlides([emptySlide()]);
    }
  }, [announcement]);

  if (!isOpen) return null;

  const updateSlide = (index: number, field: string, value: any) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (field === 'ctaLabel') {
        updated[index] = { ...updated[index], ctaButton: { ...updated[index].ctaButton, label: value } };
      } else if (field === 'ctaUrl') {
        updated[index] = { ...updated[index], ctaButton: { ...updated[index].ctaButton, url: value } };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const addSlide = () => {
    setSlides((prev) => [...prev, emptySlide()]);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) {
      toast.error('At least one slide is required');
      return;
    }
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    setSlides((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleImageSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    updateSlide(index, 'imageFile', file);
    // Create a local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      updateSlide(index, 'image', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    updateSlide(index, 'image', null);
    updateSlide(index, 'imageFile', null);
    updateSlide(index, 'imagePublicId', null);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Announcement title is required');
      return false;
    }
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i].title.trim()) {
        toast.error(`Slide ${i + 1} title is required`);
        return false;
      }
      if (!slides[i].description.trim()) {
        toast.error(`Slide ${i + 1} description is required`);
        return false;
      }
    }
    return true;
  };

  const buildSlideData = () =>
    slides.map((s, index) => ({
      title: s.title,
      description: s.description,
      image: s.imageFile ? null : s.image,
      imagePublicId: s.imageFile ? null : s.imagePublicId,
      ctaButton: s.showCta
        ? { label: s.ctaButton.label || null, url: s.ctaButton.url || null }
        : { label: null, url: null },
      order: index,
    }));

  const uploadSlideImages = async (announcementId: string) => {
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].imageFile) {
        try {
          await adminAPI.uploadSlideImage(announcementId, i, slides[i].imageFile!);
        } catch (err) {
          console.error(`Failed to upload image for slide ${i + 1}:`, err);
          toast.error(`Failed to upload image for slide ${i + 1}`);
        }
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const slideData = buildSlideData();
      let savedAnnouncement;

      if (isEditMode && announcement) {
        const response = await adminAPI.updateAnnouncement(announcement._id, {
          title,
          slides: slideData,
          status: 'draft',
        });
        savedAnnouncement = response.data.data.announcement;
      } else {
        const response = await adminAPI.createAnnouncement({
          title,
          slides: slideData,
        });
        savedAnnouncement = response.data.data.announcement;
      }

      await uploadSlideImages(savedAnnouncement._id);

      toast.success('Announcement saved as draft');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const slideData = buildSlideData();
      let savedAnnouncement;

      if (isEditMode && announcement) {
        const response = await adminAPI.updateAnnouncement(announcement._id, {
          title,
          slides: slideData,
        });
        savedAnnouncement = response.data.data.announcement;
      } else {
        const response = await adminAPI.createAnnouncement({
          title,
          slides: slideData,
        });
        savedAnnouncement = response.data.data.announcement;
      }

      await uploadSlideImages(savedAnnouncement._id);

      // Activate the announcement (archives any previously active one)
      await adminAPI.activateAnnouncement(savedAnnouncement._id);

      toast.success('Announcement published successfully');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-8 pb-20">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditMode ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
              {isEditMode && announcement && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                  announcement.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : announcement.status === 'archived'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                }`}>
                  {announcement.status}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Announcement Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Announcement Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Features for January 2026"
                maxLength={150}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Slides */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slides ({slides.length})
                </h3>
                <button
                  onClick={addSlide}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Slide
                </button>
              </div>

              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
                  >
                    {/* Slide Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Slide {index + 1}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveSlide(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSlide(index, 'down')}
                          disabled={index === slides.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSlide(index)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Slide Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => updateSlide(index, 'title', e.target.value)}
                        placeholder="Slide title"
                        maxLength={120}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Slide Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={slide.description}
                        onChange={(e) => updateSlide(index, 'description', e.target.value)}
                        placeholder="Describe this feature..."
                        maxLength={500}
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {slide.description.length}/500
                      </p>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Image (optional)
                      </label>
                      {slide.image ? (
                        <div className="relative group">
                          <img
                            src={slide.image}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <Image className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Click to upload image
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Max 2MB (JPG, PNG, WEBP)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(index, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slide.showCta}
                          onChange={(e) => updateSlide(index, 'showCta', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center">
                          <Link className="w-3.5 h-3.5 mr-1" />
                          Add CTA button
                        </span>
                      </label>
                      {slide.showCta && (
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={slide.ctaButton.label || ''}
                            onChange={(e) => updateSlide(index, 'ctaLabel', e.target.value)}
                            placeholder="Button label"
                            maxLength={50}
                            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <input
                            type="text"
                            value={slide.ctaButton.url || ''}
                            onChange={(e) => updateSlide(index, 'ctaUrl', e.target.value)}
                            placeholder="https://..."
                            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center"
              >
                {saving && <Loader className="w-4 h-4 animate-spin mr-2" />}
                Save as Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
              >
                {saving && <Loader className="w-4 h-4 animate-spin mr-2" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementFormModal;
