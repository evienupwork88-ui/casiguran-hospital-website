import { useEffect, useRef } from "react";
import { getFacebookEmbedUrl, isFacebookPortraitVideo } from "@/lib/facebook-embed";

declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement) => void;
      };
    };
  }
}

export function FacebookPostEmbed({
  postUrl,
  title,
  width = 500,
}: {
  postUrl: string;
  title: string;
  width?: number;
}) {
  const embedRef = useRef<HTMLDivElement>(null);
  const embedUrl = getFacebookEmbedUrl(postUrl);
  useEffect(() => {
    if (embedRef.current) window.FB?.XFBML.parse(embedRef.current);
  }, [embedUrl]);
  if (!embedUrl) return null;
  const isPortrait = isFacebookPortraitVideo(postUrl);

  return (
    <div ref={embedRef} className={isPortrait ? "flex justify-center" : undefined}>
      <div
        className="fb-video"
        data-href={postUrl}
        data-width={isPortrait ? "360" : String(width)}
        data-show-text="false"
        data-allowfullscreen="true"
        data-lazy="true"
        title={`Facebook video: ${title}`}
      />
    </div>
  );
}
