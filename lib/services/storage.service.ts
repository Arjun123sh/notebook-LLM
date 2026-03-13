import { supabase } from '../supabase';
import { Note, Source, SourceChunk } from '@/types';

class StorageService {
    // --- Notebooks ---
    async getNotebook(id: string) {
        const { data, error } = await supabase.from('notebooks').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    }

    // --- Sources ---
    async getSources(notebookId: string) {
        const { data, error } = await supabase.from('sources').select('*').eq('notebook_id', notebookId);
        if (error) throw error;
        return data as Source[];
    }

    async createSource(notebookId: string, name: string, type: 'pdf' | 'text' | 'url', content: string = '') {
        const { data, error } = await supabase
            .from('sources')
            .insert([{ notebook_id: notebookId, name, type, content }])
            .select()
            .single();
        if (error) throw error;
        return data as Source;
    }

    async updateSourceContent(id: string, content: string) {
        const { error } = await supabase.from('sources').update({ content }).eq('id', id);
        if (error) throw error;
    }

    async deleteSource(id: string) {
        const { error } = await supabase.from('sources').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Chunks ---
    async getChunks(notebookId: string, limit: number = 50) {
        const { data, error } = await supabase
            .from('source_chunks')
            .select('content')
            .eq('notebook_id', notebookId)
            .limit(limit);
        if (error) throw error;
        return data as Pick<SourceChunk, 'content'>[];
    }

    async insertChunks(chunks: Partial<SourceChunk>[]) {
        const { error } = await supabase.from('source_chunks').insert(chunks);
        if (error) throw error;
    }

    async matchChunks(embedding: number[], notebookId: string, topK: number = 5, threshold: number = 0.3) {
        const { data, error } = await supabase.rpc('match_source_chunks', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: topK,
            p_notebook_id: notebookId,
        });
        if (error) throw error;
        return data;
    }

    // --- Notes ---
    async getNotes(notebookId: string) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('notebook_id', notebookId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Note[];
    }

    async createNote(notebookId: string, title: string, content: string) {
        const { data, error } = await supabase
            .from('notes')
            .insert([{ notebook_id: notebookId, title: title || 'Note', content }])
            .select()
            .single();
        if (error) throw error;
        return data as Note;
    }

    async deleteNote(id: string) {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
    }
}

export const storageService = new StorageService();
