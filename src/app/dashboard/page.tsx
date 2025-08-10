'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { summarizeText, extractEntities } from '@/lib/huggingface';
import { Note } from '@/types/note';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [searchTag, setSearchTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const router = useRouter();

  // Fetch notes and tags
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email || 'No email');
        // Fetch notes with tags
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*, tags(tag_name)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (notesError) {
          console.error('Error fetching notes:', notesError);
          setError('Failed to load notes');
        } else {
          setNotes(notesData || []);
        }
        // Fetch unique tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('tag_name')
          .eq('user_id', session.user.id);
        if (tagsError) {
          console.error('Error fetching tags:', tagsError);
        } else {
          const uniqueTags = [...new Set(tagsData?.map((tag) => tag.tag_name))];
          setAvailableTags(uniqueTags);
        }
      } else {
        router.push('/');
      }
    });
  }, [router]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('You must be logged in to create a note');
      return;
    }

    const summary = await summarizeText(content);
    if (summary.startsWith('Failed') || summary.startsWith('Hugging Face')) {
      setError(summary);
      return;
    }

    const entities = await extractEntities(content);
    if (entities.length === 0) {
      setWarning('No entities found for tags. Try including names, organizations, or locations.');
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([{ user_id: session.user.id, title, content, summary }])
      .select()
      .single();
    if (error) {
      console.error('Error creating note:', error);
      setError(error.message);
      return;
    }

    if (entities.length > 0 && data) {
      const { error: tagError } = await supabase
        .from('tags')
        .insert(
          entities.map((tag_name) => ({
            note_id: data.id,
            user_id: session.user.id,
            tag_name,
          }))
        );
      if (tagError) {
        console.error('Error creating tags:', tagError);
        setError('Failed to save tags');
        return;
      }
    }

    // Refresh notes and tags
    const { data: refreshedNotes } = await supabase
      .from('notes')
      .select('*, tags(tag_name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setNotes(refreshedNotes || []);

    const { data: tagsData } = await supabase
      .from('tags')
      .select('tag_name')
      .eq('user_id', session.user.id);
    const uniqueTags = [...new Set((tagsData ?? []).map((tag) => tag.tag_name))];
    setAvailableTags(uniqueTags);

    setTitle('');
    setContent('');
  };

  // Filter notes by tag
  const filteredNotes = searchTag
    ? notes.filter((note) =>
        note.tags?.some((tag) => tag.tag_name.toLowerCase().includes(searchTag.toLowerCase()))
      )
    : notes;

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">ContextWise Dashboard</h1>
      <p className="text-lg mb-4">Welcome, {userEmail || 'User'}!</p>

      {/* Note Creation Form */}
      <form onSubmit={handleCreateNote} className="w-full max-w-md mb-8">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={4}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {warning && <p className="text-yellow-500 text-sm mb-4">{warning}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Create Note
        </button>
      </form>

      {/* Tag Search and Filter */}
      <div className="w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-2">Filter by Tag</h2>
        <input
          type="text"
          placeholder="Enter tag (e.g., Alice, Google)"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          className="w-full p-2 border rounded-md mb-4"
        />
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchTag(tag)}
              className="px-3 py-1 bg-gray-200 text-sm rounded-full hover:bg-gray-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Your Notes</h2>
        {filteredNotes.length === 0 ? (
          <p className="text-gray-500">
            {searchTag ? `No notes found for tag "${searchTag}"` : 'No notes yet. Create one above!'}
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredNotes.map((note) => (
              <li key={note.id} className="p-4 bg-gray-100 rounded-md">
                <h3 className="text-lg font-semibold">{note.title}</h3>
                <p className="text-gray-700">{note.content}</p>
                {note.summary && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Summary:</strong> {note.summary}
                  </p>
                )}
                {note.tags && note.tags.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Tags:</strong> {note.tags.map((tag) => tag.tag_name).join(', ')}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Created: {new Date(note.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
        className="mt-8 bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
      >
        Log Out
      </button>
    </main>
  );
}