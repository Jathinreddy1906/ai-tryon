"use client";

import { RotateCcw, RotateCw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  personPhotoResponseSchema,
  type PersonPhoto,
} from "@/lib/person-photos/contracts";
import {
  preparePhotoForUpload,
  validatePhotoFile,
  type PhotoCrop,
} from "@/lib/person-photos/image-preparation";

export function PersonPhotoManager() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<PersonPhoto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<PhotoCrop>("full");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshPhoto = useCallback(async () => {
    try {
      const response = await fetch("/api/person-photos", { cache: "no-store" });
      const result = await readPhotoResponse(response);
      setPhoto(result.photo);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Your saved photo could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refreshPhoto();
    }, 0);
    const refreshTimer = window.setInterval(() => {
      void refreshPhoto();
    }, 8 * 60 * 1000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshTimer);
    };
  }, [refreshPhoto]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    void preparePhotoForUpload(selectedFile, rotation, crop)
      .then((prepared) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(prepared);
        setPreparedFile(prepared);
        setPreviewUrl(objectUrl);
        setError("");
      })
      .catch((previewError: unknown) => {
        if (!cancelled) {
          setError(
            previewError instanceof Error
              ? previewError.message
              : "The photo preview could not be prepared.",
          );
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [crop, rotation, selectedFile]);

  async function selectFile(file: File | undefined) {
    if (!file) return;

    setError("");
    setNotice("");
    const validationMessage = await validatePhotoFile(file);
    if (validationMessage) {
      setError(validationMessage);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setSelectedFile(file);
    setPreparedFile(null);
    setPreviewUrl(null);
    setRotation(0);
    setCrop("full");
  }

  async function savePhoto() {
    if (!selectedFile || !preparedFile || busy) return;

    setError("");
    setNotice("");
    setProgress(0);
    setBusy(true);

    try {
      const formData = new FormData();
      formData.set("file", preparedFile, "person-photo.jpg");
      const result = await uploadPhoto(formData, setProgress);

      if (!result.photo) throw new Error("The photo was not saved. Please try again.");
      setPhoto(result.photo);
      setSelectedFile(null);
      setPreparedFile(null);
      setPreviewUrl(null);
      setRotation(0);
      setCrop("full");
      if (fileInput.current) fileInput.current.value = "";
      setNotice(result.warning ?? "Your private photo has been saved.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Your photo could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deletePhoto() {
    if (!photo || busy) return;
    if (!window.confirm("Delete your private TRYVORA photo?")) return;

    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/person-photos", {
        method: "DELETE",
      });
      const result = await readPhotoResponse(response);
      if (result.error) throw new Error(result.error);
      setPhoto(null);
      setNotice("Your private photo has been deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Your photo could not be deleted. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const previewSource = previewUrl ?? (!selectedFile ? photo?.signedUrl : null);

  return (
    <div className="person-photo-manager">
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-success" role="status">{notice}</p>}

      <div className={`person-photo-preview person-photo-preview-${selectedFile ? crop : "full"}`}>
        {previewSource ? (
          <Image
            alt={selectedFile ? "Preview of the selected personal photo" : "Your private TRYVORA photo"}
            className="person-photo-preview-image"
            fill
            onError={() => {
              if (!selectedFile) {
                setError("The private photo preview expired. Refresh the page to reopen it.");
              }
            }}
            sizes="(max-width: 700px) 90vw, 560px"
            src={previewSource}
            unoptimized
          />
        ) : (
          <div className="person-photo-placeholder">
            <Upload size={23} />
            <span>
              {selectedFile
                ? "Preparing your photo preview…"
                : loading
                  ? "Loading your private photo…"
                  : "No personal photo saved yet."}
            </span>
          </div>
        )}
      </div>

      <div className="person-photo-toolbar">
        <label className="button button-outline photo-file-picker">
          {photo ? "Choose a replacement" : "Choose a photo"}
          <input
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            disabled={busy}
            onChange={(event) => void selectFile(event.target.files?.[0])}
            ref={fileInput}
            type="file"
          />
        </label>
        {selectedFile && (
          <div className="person-photo-controls">
            <label className="photo-crop-select">
              Crop
              <select
                disabled={busy}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value === "full" || value === "portrait" || value === "square") {
                    setPreparedFile(null);
                    setPreviewUrl(null);
                    setCrop(value);
                  }
                }}
                value={crop}
              >
                <option value="full">Keep full image</option>
                <option value="portrait">Portrait · 4:5</option>
                <option value="square">Square</option>
              </select>
            </label>
            <button
              aria-label="Rotate photo left"
              className="button button-outline photo-rotate-button"
              disabled={busy}
              onClick={() => {
                setPreparedFile(null);
                setPreviewUrl(null);
                setRotation((current) => current - 90);
              }}
              type="button"
            >
              <RotateCcw size={15} /> Rotate left
            </button>
            <button
              aria-label="Rotate photo right"
              className="button button-outline photo-rotate-button"
              disabled={busy}
              onClick={() => {
                setPreparedFile(null);
                setPreviewUrl(null);
                setRotation((current) => current + 90);
              }}
              type="button"
            >
              <RotateCw size={15} /> Rotate right
            </button>
          </div>
        )}
      </div>

      {selectedFile && (
        <button
          className="button button-dark photo-save-button"
          disabled={busy || !preparedFile}
          onClick={() => void savePhoto()}
          type="button"
        >
          {busy ? "Saving securely…" : !preparedFile ? "Preparing preview…" : photo ? "Save replacement" : "Save private photo"}
        </button>
      )}
      {busy && (
        <div className="photo-upload-progress" role="status">
          <progress max="100" value={progress} />
          <span>{progress < 100 ? `Uploading ${progress}%` : "Processing and saving securely…"}</span>
        </div>
      )}
      {photo && !selectedFile && (
        <button
          className="text-button photo-delete-button"
          disabled={busy}
          onClick={() => void deletePhoto()}
          type="button"
        >
          <Trash2 size={14} /> Delete photo
        </button>
      )}

      <div className="photo-guidelines">
        <strong>For a useful preview later</strong>
        <ul>
          <li>Use one person with the body clearly visible.</li>
          <li>Choose even lighting and avoid obstructed clothing or extreme camera angles.</li>
        </ul>
        <p>
          This phase checks file integrity, format, size, and dimensions; it does not assess pose or
          body visibility. Your photo is private, access uses short-lived signed URLs, and it is not
          used to train models.
        </p>
      </div>
    </div>
  );
}

async function readPhotoResponse(response: Response) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The photo service returned an unreadable response.");
  }

  const parsed = personPhotoResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("The photo service returned an invalid response.");
  }
  if (!response.ok || parsed.data.error) {
    throw new Error(parsed.data.error ?? "The photo request could not be completed.");
  }
  return parsed.data;
}

function uploadPhoto(
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<ReturnType<typeof personPhotoResponseSchema.parse>> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/person-photos");
    request.timeout = 120_000;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      let payload: unknown;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error("The photo service returned an unreadable response."));
        return;
      }

      const parsed = personPhotoResponseSchema.safeParse(payload);
      if (!parsed.success) {
        reject(new Error("The photo service returned an invalid response."));
        return;
      }
      if (request.status < 200 || request.status >= 300 || parsed.data.error) {
        reject(new Error(parsed.data.error ?? "Your photo could not be saved."));
        return;
      }
      resolve(parsed.data);
    });
    request.addEventListener("error", () => {
      reject(new Error("The upload was interrupted. Check your connection and try again."));
    });
    request.addEventListener("timeout", () => {
      reject(new Error("The upload took too long. Check your connection and try again."));
    });
    request.send(formData);
  });
}
