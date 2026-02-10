export interface AnnouncementSlide {
  _id?: string;
  title: string;
  description: string;
  image: string | null;
  imagePublicId: string | null;
  ctaButton: {
    label: string | null;
    url: string | null;
  };
  order: number;
}

export interface Announcement {
  _id: string;
  title: string;
  slides: AnnouncementSlide[];
  status: 'draft' | 'active' | 'archived';
  publishedAt: string | null;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementFormData {
  title: string;
  slides: Omit<AnnouncementSlide, '_id'>[];
}
