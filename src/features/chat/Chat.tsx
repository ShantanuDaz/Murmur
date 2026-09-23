import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  deleteContact,
  type Contact,
} from "../../services/storage/index.ts";
import { myRoomManager } from "../engine/myRoom/myRoomManager.ts";
import { messageManager } from "./services/messageManager.ts";
import { useConnectionStore } from "../engine/store/connectionStore.ts";
import { ChatSidebar } from "./components/ChatSidebar.tsx";
import { ChatThread } from "./components/ChatThread.tsx";
import { ChatWelcome } from "./components/ChatWelcome.tsx";
import { NewConnectModal } from "./components/NewConnectModal.tsx";

const Chat = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Reactive contacts from Dexie IndexedDB
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) || [];
  const activeConnections = useConnectionStore(
    (state) => state.activeConnections,
  );

  const isPeerOnline = (accountId: string) => {
    const norm = accountId.trim().toLowerCase();
    return Boolean(activeConnections[norm]);
  };

  const selectedContact = contacts.find(
    (c) =>
      c.accountId.toLowerCase() === selectedAccountId?.toLowerCase() &&
      c.status === "accepted",
  );

  // Flush pending messages for selected contact if any
  useEffect(() => {
    if (selectedContact) {
      void messageManager.flushPendingForPeer(selectedContact.accountId);
    }
  }, [selectedContact]);

  const handleAcceptProposal = async (contact: Contact) => {
    try {
      await myRoomManager.sendProposalAcceptance(contact.accountId);
      setSelectedAccountId(contact.accountId);
    } catch (err) {
      console.error("Failed to accept proposal:", err);
    }
  };

  const handleDeclineProposal = async (contact: Contact) => {
    try {
      await deleteContact(contact.accountId);
      if (
        selectedAccountId?.toLowerCase() === contact.accountId.toLowerCase()
      ) {
        setSelectedAccountId(null);
      }
    } catch (err) {
      console.error("Failed to decline proposal:", err);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden rounded-3xl border border-border bg-secondary shadow-sm">
      <ChatSidebar
        contacts={contacts}
        selectedAccountId={selectedAccountId}
        onSelectContact={(id) => setSelectedAccountId(id)}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onAcceptProposal={handleAcceptProposal}
        onDeclineProposal={handleDeclineProposal}
        isPeerOnline={isPeerOnline}
      />

      {selectedContact ? (
        <ChatThread
          contact={selectedContact}
          isOnline={isPeerOnline(selectedContact.accountId)}
        />
      ) : (
        <ChatWelcome onOpenConnectModal={() => setIsConnectModalOpen(true)} />
      )}

      <NewConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
};

export default Chat;
