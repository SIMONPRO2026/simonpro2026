'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { ConfirmDialog } from '@/components/ui'
import { formatDateTime, getInitials, getRoleLabel } from '@/lib/utils'
import { Send, MessageSquare, Trash2, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'

function ChatContent() {
  const searchParams = useSearchParams()
  const { projects, currentUser, sendChat, deleteChat } = useAppStore()
  const [selectedProyekId, setSelectedProyekId] = useState(searchParams.get('proyek') || projects[0]?.id || '')
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const proyek = projects.find(p => p.id === selectedProyekId)
  const filteredProjects = projects.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) || p.kode.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [proyek?.chat?.length, selectedProyekId])

  const selectProyek = (id: string) => {
    setSelectedProyekId(id)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const sendMsg = () => {
    if (!msg.trim() || !currentUser || !proyek) return
    sendChat(selectedProyekId, {
      proyekId: selectedProyekId, userId: currentUser.id, userName: currentUser.name,
      userRole: currentUser.role, message: msg.trim(), type: 'text',
    })
    setMsg('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleDeleteMsg = () => {
    if (!deleteMsgId || !proyek) return
    deleteChat(selectedProyekId, deleteMsgId)
    toast.success('Pesan dihapus')
    setDeleteMsgId(null)
  }

  const totalUnread = projects.reduce((s, p) => s + p.chat.length, 0)

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left sidebar - Project list */}
      <div className="w-64 bg-white border-r border-slate-100 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProjects.map(p => {
            const lastMsg = p.chat[p.chat.length - 1]
            const isSelected = selectedProyekId === p.id
            const healthColors = { on_track: 'bg-green-500', warning: 'bg-amber-500', kritis: 'bg-red-500' }
            return (
              <button key={p.id} onClick={() => selectProyek(p.id)}
                className={`w-full text-left px-3 py-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                      {p.kode.split('-')[1] || p.kode.slice(0,2)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${healthColors[p.health]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold line-clamp-1 ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{p.nama}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.kode}</div>
                    {lastMsg && (
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        <span className="font-medium">{lastMsg.userName.split(' ')[0]}:</span> {lastMsg.message}
                      </div>
                    )}
                  </div>
                  {p.chat.length > 0 && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{p.chat.length}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Bottom user info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {getInitials(currentUser?.name || 'U')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-700 truncate">{currentUser?.name?.split(' ')[0]}</div>
              <div className="text-[10px] text-slate-400">{getRoleLabel(currentUser?.role || 'pptk')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {proyek ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="font-bold text-slate-800 text-sm">{proyek.nama}</div>
                <div className="text-xs text-slate-400">{proyek.kode} · {proyek.chat.length} pesan</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>{proyek.assignedUsers?.length || 0} anggota</span>
                <div className={`w-2 h-2 rounded-full ml-2 ${{ on_track:'bg-green-500', warning:'bg-amber-500', kritis:'bg-red-500' }[proyek.health]}`} />
                <span>{{ on_track:'On Track', warning:'Warning', kritis:'Kritis' }[proyek.health]}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {proyek.chat.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                  <div className="text-base font-semibold">Belum ada pesan</div>
                  <div className="text-sm mt-1">Mulai diskusi tentang proyek ini</div>
                </div>
              ) : (
                proyek.chat.map(message => {
                  const isMe = message.userId === currentUser?.id
                  const canDelete = isMe || currentUser?.role === 'admin' || currentUser?.role === 'ppk'
                  return (
                    <div key={message.id}
                      className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
                      onMouseEnter={() => setHoveredMsg(message.id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      {/* Avatar - other user */}
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0 mb-5">
                          {getInitials(message.userName)}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Name + role */}
                        {!isMe && (
                          <div className="text-[10px] text-slate-500 mb-1 ml-1 font-semibold">
                            {message.userName} · <span className="font-normal">{getRoleLabel(message.userRole)}</span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                          ${isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                          }`}>
                          {message.message}
                        </div>

                        {/* Timestamp + delete */}
                        <div className={`flex items-center gap-2 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className="text-[10px] text-slate-400">{formatDateTime(message.timestamp)}</div>
                          {canDelete && hoveredMsg === message.id && (
                            <button onClick={() => setDeleteMsgId(message.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Avatar - me */}
                      {isMe && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mb-5">
                          {getInitials(currentUser?.name || 'U')}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="bg-white border-t border-slate-100 p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {getInitials(currentUser?.name || 'U')}
                </div>
                <div className="flex-1 relative">
                  <input ref={inputRef} type="text" value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                    placeholder={`Pesan ke ${proyek.kode}... (Enter kirim)`}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                </div>
                <button onClick={sendMsg} disabled={!msg.trim()}
                  className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 ml-11 flex items-center gap-1">
                <span>Semua pesan tersimpan dan masuk audit log sistem</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <div className="text-base font-semibold">Pilih proyek untuk mulai chat</div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteMsgId} onClose={() => setDeleteMsgId(null)} onConfirm={handleDeleteMsg}
        title="Hapus Pesan?" message="Pesan ini akan dihapus permanen dari riwayat chat." confirmLabel="Hapus" />
    </div>
  )
}

export default function ChatPage() {
  return (
    <>
      <Topbar title="Chat Proyek" subtitle="Komunikasi realtime per proyek" />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400">Memuat chat...</div>}>
        <ChatContent />
      </Suspense>
    </>
  )
}
