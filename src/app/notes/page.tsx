'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types/note';

export default function AllNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data, error } = await supabase
          .from('notes')
          .select('*, tags(tag_name)')
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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">All Notes</h1>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="w-full max-w-2xl">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-center">No notes yet. Create some on the dashboard!</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li
                key={note.id}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-800">{note.title}</h3>
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
                <p className="text-sm text-gray-500 mt-2">
                  Created: {new Date(note.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}