import React from 'react';
export default function ParentChats() {
  return (
    <div className="p-4 space-y-4 h-full">
      <h1 className="text-xl font-semibold">Parent Chats</h1>
      <div className="grid md:grid-cols-4 gap-4 h-[70vh]">
        <div className="col-span-1 border rounded flex flex-col">
          <div className="p-2 border-b text-xs font-medium tracking-wide">Conversations</div>
          <div className="flex-1 overflow-y-auto text-sm divide-y">
            {[1,2,3,4,5].map(i => (
              <button key={i} className="w-full text-left px-3 py-2 hover:bg-muted">
                Parent {i}\n                <div className="text-xs text-muted-foreground">Last message preview...</div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-3 border rounded flex flex-col">
          <div className="p-2 border-b text-sm font-medium">Chat with Parent 1</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm bg-muted/20">
            {[1,2,3].map(i => (
              <div key={i} className="max-w-sm">
                <div className="rounded-md bg-card border px-3 py-2 shadow-sm">Message {i} content placeholder.</div>
                <div className="text-[10px] mt-1 text-muted-foreground">Now</div>
              </div>
            ))}
          </div>
          <form className="p-2 border-t flex gap-2">
            <input className="flex-1 border rounded px-2 py-1.5 text-sm" placeholder="Type a message" />
            <button type="button" className="bg-primary text-primary-foreground px-4 rounded text-sm">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
