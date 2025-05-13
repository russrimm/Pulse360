export interface Message {
  id: string;
  title: string;
  service: string[];
  lastUpdated: string;
  published: string;
  tags: string[];
  content: string;
  summary: string;
  details: {
    name: string;
    value: string;
  }[];
  isMajorChange: boolean;
  actionRequiredByDateTime?: string;
}

export interface MessageResponse {
  messages: Message[];
  total: number;
} 