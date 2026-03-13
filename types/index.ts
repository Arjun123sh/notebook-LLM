export interface Notebook {
  id: string;
  title: string;
  created_at: string;
  source_count?: number;
}

export interface Source {
  id: string;
  notebook_id: string;
  name: string;
  type: 'pdf' | 'text' | 'url';
  url?: string;
  content?: string;
  created_at: string;
}

export interface SourceChunk {
  id: string;
  source_id: string;
  notebook_id: string;
  content: string;
  metadata: {
    pageNumber?: number;
    charOffset?: number;
    sourceName?: string;
    chunkIndex?: number;
  };
  similarity?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: Citation[];
  createdAt?: Date;
  notebook_id?: string;
}

export interface Citation {
  index: number;
  content: string;
  sourceId: string;
  sourceName?: string;
  chunkId?: string;
}

export interface Note {
  id: string;
  notebook_id: string;
  title: string;
  content: string;
  created_at: string;
}
