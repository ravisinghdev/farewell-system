"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  FileIcon,
  Loader2,
  Paperclip,
  Send,
  Smile,
  X,
  Mic,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "../chat-types";

interface ChatInputProps {
  onSendMessage: (content: string, file: File | null) => void;
  onTyping: () => void;
  isPending: boolean;
  replyTo: Message | null;
  onCancelReply: () => void;
}

const COMMON_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "🔥",
  "🎉",
  "👀",
  "💯",
  "👋",
  "🙏",
  "🤝",
  "✨",
  "🚀",
  "🤔",
  "🤷‍♂️",
  "💀",
  "💩",
  "🤡",
];

export function ChatInput({
  onSendMessage,
  onTyping,
  isPending,
  replyTo,
  onCancelReply,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingRef = useRef<number>(0);

  // WhatsApp-style auto resize
  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      120
    )}px`;
  }, [inputValue]);

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingRef.current > 1000) {
      onTyping();
      lastTypingRef.current = now;
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim() && !selectedFile) return;
    onSendMessage(inputValue, selectedFile);
    setInputValue("");
    setSelectedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-6 left-4 right-4 z-30"
    >
      <div className="max-w-4xl mx-auto relative">
        {/* Reply + Attachment Preview */}
        <AnimatePresence>
          {(replyTo || selectedFile) && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="absolute bottom-full left-0 right-0 mb-3"
            >
              <div
                className="
                rounded-xl 
                border border-gray-200 
                shadow-md 
                p-3 flex justify-between items-center text-sm
              "
              >
                <div className="flex items-center gap-3 truncate pr-4">
                  {replyTo && (
                    <div className="flex flex-col">
                      <span className="text-green-600 font-semibold text-xs">
                        Replying to {replyTo.user?.full_name?.split(" ")[0]}
                      </span>
                      <span className="truncate opacity-70 max-w-[200px]">
                        {replyTo.content || "Attachment"}
                      </span>
                    </div>
                  )}

                  {selectedFile && (
                    <div
                      className="
                      flex items-center gap-2
                      bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200
                    "
                    >
                      <FileIcon className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-700">
                        {selectedFile.name}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    onCancelReply();
                    setSelectedFile(null);
                  }}
                  className="
                    h-7 w-7 rounded-full 
                    text-gray-500 hover:text-gray-700 hover:bg-gray-200
                  "
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp-style input capsule */}
        <div
          className="
          flex items-end gap-2
          p-2 pl-3
          border border-gray-300
          rounded-3xl
          shadow-lg
        "
        >
          {/* Emoji */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="
                  h-10 w-10 rounded-full 
                  text-gray-500 hover:text-gray-700
                "
              >
                <Smile className="h-6 w-6" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="start"
              className="
                w-64 p-3 
                bg-white border border-gray-200 
                shadow-xl rounded-2xl
              "
            >
              <div className="grid grid-cols-6 gap-2">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => insertEmoji(e)}
                    className="
                      h-9 w-9 text-lg
                      flex items-center justify-center 
                      rounded-full 
                      hover:bg-gray-100 transition
                    "
                  >
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message"
              className="
                w-full bg-transparent
                text-gray-900
                placeholder:text-gray-400
                text-sm resize-none px-1 py-2
                leading-relaxed focus:outline-none
              "
            />
          </div>

          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
            }}
          />

          {/* Attach */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="
              h-10 w-10 rounded-full 
              text-gray-500 hover:text-gray-700
            "
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Send / Mic */}
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={(!inputValue.trim() && !selectedFile) || isPending}
              className={cn(
                "h-11 w-11 rounded-full transition",
                !inputValue.trim() && !selectedFile
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-md"
              )}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : inputValue.trim() || selectedFile ? (
                <Send className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
