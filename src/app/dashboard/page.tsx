'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { summarizeText } from '@/lib/huggingface';
import { Note } from '@/types/note';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check auth and fetch notes
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email || 'No email');
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching notes:', error);
          setError('Failed to load notes');
        } else {
          setNotes(data || []);
        }
      } else {
        router.push('/');
      }
    });
  }, [router]);

  // Handle note creation with summary
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('You must be logged in to create a note');
      return;
    }

    // Generate summary
    const summary = await summarizeText(content);

    const { error } = await supabase
      .from('notes')
      .insert([{ user_id: session.user.id, title, content, summary }]);
    if (error) {
      console.error('Error creating note:', error);
      setError(error.message);
    } else {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setNotes(data || []);
      setTitle('');
      setContent('');
    }
  };

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
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Create Note
        </button>
      </form>

      {/* Notes List */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Your Notes</h2>
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet. Create one above!</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="p-4 bg-gray-100 rounded-md">
                <h3 className="text-lg font-semibold">{note.title}</h3>
                <p className="text-gray-700">{note.content}</p>
                {note.summary && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Summary:</strong> {note.summary}
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