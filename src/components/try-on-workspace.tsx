"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  personPhotoResponseSchema,
  tryOnStartResponseSchema,
  tryOnStatusResponseSchema,
  type PersonPhoto,
} from "@/lib/person-photos/contracts";

export type TryOnProductOption = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  image: string;
  imageAlt: string;
};

type TryOnWorkspaceProps = {
  products: TryOnProductOption[];
  initialProductSlug?: string;
};

export function TryOnWorkspace({
  products,
  initialProductSlug,
}: TryOnWorkspaceProps) {
  const [photo, setPhoto] = useState<PersonPhoto | null>(null);
  const [selectedSlug, setSelectedSlug] = useState(() =>
    products.some((product) => product.slug === initialProductSlug)
      ? initialProductSlug ?? ""
      : products[0]?.slug ?? "",
  );
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adultAttestation, setAdultAttestation] = useState(false);
  const [ownPhotoAttestation, setOwnPhotoAttestation] = useState(false);
  const [fashnProcessingConsent, setFashnProcessingConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "starting" | "in_queue" | "processing" | "completed" | "failed" | "expired" | null
  >(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const selectedProduct = products.find((product) => product.slug === selectedSlug);
  const activeJobRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/person-photos", { cache: "no-store" })
      .then(async (response) => {
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new Error("Your saved photo could not be loaded.");
        }
        const parsed = personPhotoResponseSchema.safeParse(payload);
        if (!response.ok || !parsed.success) {
          throw new Error(
            parsed.success
              ? parsed.data.error ?? "Your saved photo could not be loaded."
              : "Your saved photo could not be loaded.",
          );
        }
        if (active) setPhoto(parsed.data.photo);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : "Your saved photo could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingPhoto(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId || status === "completed" || status === "failed" || status === "expired") {
      return;
    }

    let active = true;
    let timeout: number | undefined;

    const poll = async () => {
      try {
        const response = await fetch(`/api/try-on/${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new Error("The try-on service returned an unreadable status.");
        }

        const parsed = tryOnStatusResponseSchema.safeParse(payload);
        if (!response.ok || !parsed.success) {
          throw new Error(
            parsed.success
              ? parsed.data.error ?? "The try-on status could not be checked."
              : typeof payload === "object" &&
                  payload !== null &&
                  "error" in payload &&
                  typeof payload.error === "string"
                ? payload.error
                : "The try-on status could not be checked.",
          );
        }

        if (!active) return;
        setStatus(parsed.data.status);
        if (parsed.data.status === "completed" && parsed.data.outputImage) {
          setOutputImage(parsed.data.outputImage);
          activeJobRef.current = null;
          return;
        }
        if (parsed.data.status === "completed") {
          setStatus("failed");
          activeJobRef.current = null;
          setError("The try-on service completed without returning an image.");
          return;
        }
        if (parsed.data.status === "failed" || parsed.data.status === "expired") {
          activeJobRef.current = null;
        }
        if (parsed.data.error) setError(parsed.data.error);
        if (
          parsed.data.status === "starting" ||
          parsed.data.status === "in_queue" ||
          parsed.data.status === "processing"
        ) {
          timeout = window.setTimeout(poll, 2500);
        }
      } catch (pollError) {
        if (!active) return;
        setError(
          pollError instanceof Error
            ? pollError.message
            : "The try-on status could not be checked.",
        );
        timeout = window.setTimeout(poll, 5000);
      }
    };

    timeout = window.setTimeout(poll, 1500);
    return () => {
      active = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [jobId, status]);

  async function startTryOn() {
    if (
      !selectedProduct ||
      !photo ||
      !adultAttestation ||
      !ownPhotoAttestation ||
      !fashnProcessingConsent ||
      starting ||
      activeJobRef.current
    ) {
      return;
    }

    setError("");
    setJobId(null);
    setOutputImage(null);
    setStatus("starting");
    setStarting(true);
    activeJobRef.current = "starting";
    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: selectedProduct.slug,
          adultAttestation,
          ownPhotoAttestation,
          fashnProcessingConsent,
        }),
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The try-on service returned an unreadable response.");
      }
      const parsed = tryOnStartResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        throw new Error(
          parsed.success
            ? "The try-on could not be started."
            : typeof payload === "object" &&
                payload !== null &&
                "error" in payload &&
                typeof payload.error === "string"
              ? payload.error
              : "The try-on could not be started.",
        );
      }

      activeJobRef.current = parsed.data.jobId;
      setJobId(parsed.data.jobId);
      setStatus(parsed.data.status);
    } catch (startError) {
      activeJobRef.current = null;
      setStatus(null);
      setError(
        startError instanceof Error
          ? startError.message
          : "The try-on could not be started.",
      );
    } finally {
      setStarting(false);
    }
  }

  function clearResult() {
    setJobId(null);
    setStatus(null);
    setOutputImage(null);
    setError("");
    activeJobRef.current = null;
    setAdultAttestation(false);
    setOwnPhotoAttestation(false);
    setFashnProcessingConsent(false);
  }

  const busy =
    starting ||
    status === "starting" ||
    status === "in_queue" ||
    status === "processing";

  return (
    <div className="try-on-workspace">
      {loadError && <p className="auth-error" role="alert">{loadError}</p>}

      {products.length === 0 ? (
        <div className="auth-notice" role="status">
          Try-on is available only for published, non-sample catalogue items with image rights
          confirmed. No such item is configured yet.
        </div>
      ) : (
        <>
          <label className="try-on-product-select">
            Choose a live catalogue piece
            <select
              disabled={busy}
              onChange={(event) => {
                clearResult();
                setSelectedSlug(event.currentTarget.value);
              }}
              value={selectedSlug}
            >
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.name} · {product.brand}
                </option>
              ))}
            </select>
          </label>

          <div className="try-on-input-grid">
            <div className="try-on-input-card">
              <span className="eyebrow">YOUR PRIVATE PHOTO</span>
              <div className="try-on-input-image">
                {photo ? (
                  <Image
                    alt="Your private TRYVORA photo"
                    fill
                    sizes="(max-width: 700px) 90vw, 260px"
                    src={photo.signedUrl}
                    unoptimized
                  />
                ) : (
                  <span>{loadingPhoto ? "Loading your photo…" : "No photo saved"}</span>
                )}
              </div>
              {!photo && !loadingPhoto && (
                <Link className="text-link" href="/account/photos">Manage your private photo</Link>
              )}
            </div>
            {selectedProduct && (
              <div className="try-on-input-card">
                <span className="eyebrow">SELECTED GARMENT</span>
                <div className="try-on-input-image">
                  <Image
                    alt={selectedProduct.imageAlt}
                    fill
                    sizes="(max-width: 700px) 90vw, 260px"
                    src={selectedProduct.image}
                    unoptimized
                  />
                </div>
                <strong>{selectedProduct.name}</strong>
                <span>{selectedProduct.brand} · {selectedProduct.category}</span>
              </div>
            )}
          </div>

          <div className="try-on-consent">
            <strong>Before you continue</strong>
            <label>
              <input
                checked={adultAttestation}
                disabled={busy}
                onChange={(event) => setAdultAttestation(event.currentTarget.checked)}
                type="checkbox"
              />
              I am 18 or older.
            </label>
            <label>
              <input
                checked={ownPhotoAttestation}
                disabled={busy}
                onChange={(event) => setOwnPhotoAttestation(event.currentTarget.checked)}
                type="checkbox"
              />
              This is my own photo, and I consent to its use for this try-on.
            </label>
            <label>
              <input
                checked={fashnProcessingConsent}
                disabled={busy}
                onChange={(event) => setFashnProcessingConsent(event.currentTarget.checked)}
                type="checkbox"
              />
              I consent to sending this photo to FASHN for processing under the data handling
              described below.
            </label>
            <p>
              The photo is sent as base64 so its URL is not stored in FASHN request history.
              FASHN reports that request records are retained and not automatically deleted;
              they can include the public garment-image URL and request parameters.
              Processing copies are deleted after processing with a one-day cleanup backstop.
              The generated output is base64 and available from FASHN for 60 minutes. Processing
              may involve FASHN&apos;s listed subprocessors in the US, EU, and global regions,
              including Southeast Asia. FASHN states it does not train models on customer content
              unless separately opted in. See the{" "}
              <a href="https://docs.fashn.ai/api-overview/data-retention-privacy" rel="noreferrer" target="_blank">
                data retention details
              </a>
              ,{" "}
              <a href="https://fashn.ai/legal/subprocessors" rel="noreferrer" target="_blank">
                subprocessor list
              </a>
              , and{" "}
              <a href="https://fashn.ai/legal/terms-of-service" rel="noreferrer" target="_blank">
                terms
              </a>
              .
            </p>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {busy && (
            <p className="try-on-progress" role="status">
              {status === "starting"
                ? "Starting the try-on…"
                : status === "in_queue"
                  ? "Your request is queued…"
                  : "Generating your preview…"}
            </p>
          )}
          <button
            className="button button-dark try-on-start-button"
            disabled={
              !selectedProduct ||
              !photo ||
              !adultAttestation ||
              !ownPhotoAttestation ||
              !fashnProcessingConsent ||
              busy ||
              loadingPhoto
            }
            onClick={() => void startTryOn()}
            type="button"
          >
            {busy ? "Creating your preview…" : "Generate preview · 1 credit"}
          </button>
          <p className="try-on-usage-note">
            One image per request, up to three requests in 24 hours. Results are not saved to your
            TRYVORA account and are held in this page only.
          </p>

          {outputImage && (
            <section className="try-on-result" aria-live="polite">
              <div className="try-on-result-image">
                <Image
                  alt="AI-generated virtual try-on preview"
                  fill
                  sizes="(max-width: 700px) 90vw, 520px"
                  src={outputImage}
                  unoptimized
                />
              </div>
              <p>
                AI-generated preview, not a fit, size, colour, or product-accuracy guarantee.
                Review the actual garment listing before making a purchase.
              </p>
              <button className="text-button" onClick={clearResult} type="button">
                Clear preview
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
