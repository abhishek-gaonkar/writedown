import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { IChannelData, IMessageData } from "@/types/utils/firebaseOperations";
import { selectedChannelIdAtom } from "@/stores/selectedChannelIdAtom";
import { MilkdownEditorWrapper } from "@/components/ui/MildownEditor";
import { IFirebaseAuth } from "@/types/components/firebase-hooks";
import { createNewMessage } from "@/utils/firebaseOperations";
import { converter } from "@/utils/firestoreDataConverter";
import React, { FormEvent, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Button from "@/components/ui/Button";
import Editor from "@/components/ui/Editor";
import { uuidv4 } from "@firebase/util";
import ChatBubble from "./ChatBubble";
import { db } from "@/lib/firebase";
import { nanoid } from "nanoid";
import { useAtom } from "jotai";

const channelConverter = converter<IChannelData>();
const messagesConverter = converter<IMessageData>();

const ChatList = ({ user }: IFirebaseAuth) => {
  const [input, setInput] = useState("");
  const [clear, setClear] = useState(false);
  const [selectedChannelId] = useAtom(selectedChannelIdAtom);

  const [channel] = useDocumentData(
    selectedChannelId && user
      ? doc(db, "users", user.uid, "channels", selectedChannelId)
          .withConverter(channelConverter)
          .withConverter(channelConverter)
      : null,
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const [messages] = useCollectionData(
    user && selectedChannelId
      ? query(
          collection(
            db,
            "users",
            user.uid,
            "channels",
            selectedChannelId,
            "messages"
          ),
          orderBy("createdAt"),
          limit(10)
        ).withConverter(messagesConverter)
      : null,
    {
      initialValue: [],
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const messageSubmitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !selectedChannelId) return;

    createNewMessage(selectedChannelId, user?.uid, {
      id: uuidv4(),
      text: input,
      updated: false,
      type: "message",
      createdAt: serverTimestamp() as Timestamp,
      channelId: selectedChannelId,
      slug: nanoid(),
      userId: user.uid,
    });

    setClear(true);
    setInput("");
  };

  return (
    <div className="flex h-full w-full flex-col justify-between md:p-5">
      <div className="m-5 flex flex-col gap-y-1 overflow-y-auto px-2">
        {selectedChannelId &&
          messages?.map((message) => {
            return (
              <ChatBubble
                key={message.id}
                messageData={message}
                channelData={channel}
              />
            );
          })}
      </div>

      {/* BOTTOM BAR */}
      <form
        className="md:items flex flex-col gap-2 p-2 md:flex-row"
        onSubmit={messageSubmitHandler}
      >
        {selectedChannelId && channel ? (
          <>
            <MilkdownEditorWrapper />

            {/* <Editor
              channelData={channel}
              input={input}
              setInput={setInput}
              clearSwitch={clear}
              setClearSwitch={setClear}
            /> */}
            <Button variant="solid-black" type="submit">
              Submit
            </Button>
          </>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </form>

      {/* BOTTOM BAR */}
    </div>
  );
};

export default ChatList;
