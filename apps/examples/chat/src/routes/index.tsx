import { ChatView } from '../ChatView'

/** `/` — a new chat. Sending the first message creates it and moves to `/c/:id`. */
export default function NewChat() {
  return <ChatView conversation={null} />
}
