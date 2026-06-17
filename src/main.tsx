import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Sync offline incident queue when back online
window.addEventListener('online', async () => {
  const queue: unknown[] = JSON.parse(localStorage.getItem('tide_ims_offline_queue') ?? '[]')
  if (!queue.length) return

  const { supabase } = await import('./lib/supabase')
  const failed: unknown[] = []

  for (const incident of queue) {
    const { tempId, ...data } = incident as Record<string, unknown>
    const { error } = await supabase.from('incidents').insert(data)
    if (error) failed.push(incident)
  }

  localStorage.setItem('tide_ims_offline_queue', JSON.stringify(failed))
  if (!failed.length) console.log('[Tide IMS] Offline queue synced successfully.')
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
