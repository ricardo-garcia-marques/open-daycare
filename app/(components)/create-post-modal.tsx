"use client";

import { useEffect, useRef, useState } from "react";
import { useKidOptions } from "@/lib/use-kid-options";
import {
  POST_TYPE_BADGE_COLORS,
  POST_TYPE_LABELS,
  type PostType,
} from "@/lib/mock-feed";

const POST_TYPE_ORDER: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

const MAX_PHOTOS = 4;

export type CreatePostPayload = {
  selectedKidIds: string[];
  wholeRoom: boolean;
  type: PostType;
  description: string;
  photos: string[];
};

function CameraGlyphIcon() {
  return (
    <svg
      aria-hidden="true"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C5503A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CreatePostModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: CreatePostPayload) => void;
}) {
  const kids = useKidOptions();
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [wholeRoom, setWholeRoom] = useState(false);
  const [type, setType] = useState<PostType | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function toggleKid(kidId: string) {
    setWholeRoom(false);
    setSelectedKidIds((current) =>
      current.includes(kidId)
        ? current.filter((id) => id !== kidId)
        : [...current, kidId]
    );
  }

  function chooseWholeRoom() {
    setSelectedKidIds([]);
    setWholeRoom(true);
  }

  function openFilePicker() {
    if (photos.length < MAX_PHOTOS) {
      fileInputRef.current?.click();
    }
  }

  function handleFilesChosen(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    // Object URLs must be created synchronously: the FileList is emptied as
    // soon as the input value is reset, before React runs state updaters.
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      newUrls.push(URL.createObjectURL(file));
    }
    setPhotos((current) => {
      const room = MAX_PHOTOS - current.length;
      if (room <= 0) {
        for (const url of newUrls) {
          URL.revokeObjectURL(url);
        }
        return current;
      }
      const kept = newUrls.slice(0, room);
      for (const url of newUrls.slice(room)) {
        URL.revokeObjectURL(url);
      }
      return [...current, ...kept];
    });
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  const canPublish =
    type !== null &&
    description.trim().length > 0 &&
    (wholeRoom || selectedKidIds.length > 0);

  function handleSubmit() {
    if (!canPublish || type === null) {
      return;
    }
    onSubmit({
      selectedKidIds,
      wholeRoom,
      type,
      description: description.trim(),
      photos,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[580px] rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer bg-transparent p-0 text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span
            id="create-post-modal-title"
            className="flex-1 px-3 text-center font-display text-[18px] font-semibold text-[#3F362E]"
          >
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canPublish}
            className="cursor-pointer bg-transparent p-0 text-[15px] font-extrabold text-[#D9583C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publicar
          </button>
        </div>

        <div
          className="relative max-h-[calc(100vh-120px)] overflow-y-auto px-[26px] py-6"
        >
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            PARA
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {kids.map((kid) => {
              const selected = selectedKidIds.includes(kid.id);
              return (
                <button
                  key={kid.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleKid(kid.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold ${
                    selected
                      ? "border-[#3F362E] bg-[#3F362E] text-white"
                      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{
                      background: kid.avatarBgColor,
                      color: kid.avatarTextColor,
                    }}
                  >
                    {kid.initial}
                  </span>
                  {kid.name.split(" ")[0]}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={wholeRoom}
              onClick={chooseWholeRoom}
              className={`cursor-pointer rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold ${
                wholeRoom
                  ? "border-[#3F362E] bg-[#3F362E] text-white"
                  : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
          </div>

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            TIPO
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {POST_TYPE_ORDER.map((postType) => {
              const selected = type === postType;
              const colors = POST_TYPE_BADGE_COLORS[postType];
              return (
                <button
                  key={postType}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setType(postType)}
                  className="cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-extrabold"
                  style={
                    selected
                      ? {
                          background: colors.bg,
                          color: colors.text,
                          border: "1.5px solid " + colors.bg,
                        }
                      : {
                          background: "#FFFDF9",
                          color: "#6E6359",
                          border: "1.5px solid #ECE0D0",
                        }
                  }
                >
                  {POST_TYPE_LABELS[postType]
                    .toLowerCase()
                    .replace(/^\p{L}/u, (char) => char.toUpperCase())}
                </button>
              );
            })}
          </div>

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            <label htmlFor="create-post-description">DESCRIPCIÓN</label>
          </div>
          <textarea
            id="create-post-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contá cómo le fue hoy…"
            className="mb-[22px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
          />

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            FOTOS
          </div>
          <div className="flex flex-wrap gap-3">
            {photos.map((photoUrl, index) => (
              <button
                key={photoUrl}
                type="button"
                onClick={() => removePhoto(index)}
                title="Quitar foto"
                className="h-24 w-24 cursor-pointer overflow-hidden rounded-[14px] border border-[#ECE0D0] p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt={`Foto ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {photos.length === 0 && (
              <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1] text-[#CBB89F]">
                <CameraGlyphIcon />
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={openFilePicker}
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
              >
                <PlusIcon />
                <span className="text-[12px]">Agregar</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            aria-hidden="true"
            tabIndex={-1}
            className="hidden"
            onChange={(event) => {
              handleFilesChosen(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
