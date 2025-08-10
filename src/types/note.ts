export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary?: string; // Optional, as existing notes may not have summaries
  created_at: string;
  updated_at: string;
  tags?: {tag_name: string }[];
};