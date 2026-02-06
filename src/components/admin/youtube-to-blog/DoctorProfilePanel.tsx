import { useState, useRef } from 'react';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';

interface DoctorProfilePanelProps {
  post: BlogPost;
  onUpdate: (post: BlogPost) => void;
  editor?: any;
}

export function DoctorProfilePanel({ post, onUpdate, editor }: DoctorProfilePanelProps) {
  const [name, setName] = useState(post.doctor_name || '');
  const [title, setTitle] = useState(post.doctor_title || '');
  const [credentials, setCredentials] = useState(post.doctor_credentials || '');
  const [bio, setBio] = useState(post.doctor_bio || '');
  const [image, setImage] = useState(post.doctor_image || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [researching, setResearching] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const originalNameRef = useRef(post.doctor_name || '');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: name || null,
          doctor_title: title || null,
          doctor_credentials: credentials || null,
          doctor_bio: bio || null,
          doctor_image: image || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.post);

        // If doctor name changed, re-sync TipTap editor with server-updated content
        if (name !== originalNameRef.current && editor && data.post.content) {
          editor.commands.setContent(data.post.content);
        }
        originalNameRef.current = name;

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResearch = async () => {
    setResearching(true);
    try {
      const res = await fetch(`/api/blog/posts/${post.id}/research-doctor`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.doctor_info) {
          setName(data.doctor_info.name || '');
          setTitle(data.doctor_info.title || '');
          setCredentials(data.doctor_info.credentials || '');
          setBio(data.doctor_info.bio || '');
          // Refetch post to get doctor_image from R2 download
          const postRes = await fetch(`/api/blog/posts/${post.id}`);
          if (postRes.ok) {
            const postData = await postRes.json();
            if (postData.post?.doctor_image) {
              setImage(postData.post.doctor_image);
            }
            onUpdate(postData.post);
          }
        } else {
          alert('No doctor/expert information found in the video content.');
        }
      }
    } catch {
      alert('Research failed. Please try again.');
    } finally {
      setResearching(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', 'doctor');

    try {
      const res = await fetch(`/api/blog/posts/${post.id}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImage(data.url);
        onUpdate({ ...post, doctor_image: data.url });
      } else {
        const data = await res.json();
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setImage('');
    try {
      await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_image: null }),
      });
      onUpdate({ ...post, doctor_image: null });
    } catch {
      // silent fail for photo removal
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Doctor / Expert Profile</h2>
          <button
            onClick={handleResearch}
            disabled={researching}
            className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {researching ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Researching...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Auto-Research
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          If the video features a medical professional, add their profile for credibility and SEO.
        </p>

        {/* Profile Photo */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          {image ? (
            <img
              src={image}
              alt={name || 'Doctor'}
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-md flex-shrink-0">
              {name ? name.charAt(0) : '?'}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 mb-2">Profile Photo</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {uploadingPhoto ? 'Uploading...' : image ? 'Change Photo' : 'Upload Photo'}
              </button>
              {image && (
                <button
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dr. Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Professional Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Board Certified Dermatologist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Credentials</label>
            <input
              type="text"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="MD, FAAD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="A brief professional bio..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          {name && (
            <button
              onClick={() => { setName(''); setTitle(''); setCredentials(''); setBio(''); setImage(''); }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
