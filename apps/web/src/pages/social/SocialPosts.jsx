import React from 'react';
export default function SocialPosts() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Social Posts</h1>
      <div className="flex gap-2 text-sm">
        <button className="bg-primary text-primary-foreground px-3 py-1 rounded">New Post</button>
        <button className="border px-3 py-1 rounded">Filter</button>
      </div>
      <ul className="space-y-2 text-sm">
        {[1,2,3].map(i => (
          <li key={i} className="border rounded p-3">
            <div className="font-medium">Scheduled Post {i}</div>
            <div className="text-xs text-muted-foreground">Platform: Instagram • Status: Draft</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
